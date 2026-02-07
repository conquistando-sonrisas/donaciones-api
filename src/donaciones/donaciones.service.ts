import { Inject, Injectable, Logger } from '@nestjs/common';
import { MP_CLIENT } from './mercado-pago.constants';
import { Payment, PreApproval } from 'mercadopago';
import { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types';
import { ConfigService } from '@nestjs/config';
import { PreApprovalRequest, PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { InjectRepository } from '@nestjs/typeorm';
import { Donador } from './entities/donador.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateDonadorDto } from './dtos/create-donor.dto';
import { Fiscal } from './entities/fiscal.entity';
import { EncryptionService } from 'src/encryption/encryption.service';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { Donacion } from './entities/donacion.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { RecurringDonacion } from './entities/recurring-donacion.entity';
import { ActionToken } from './entities/action-token.entity';
import { addHours } from 'date-fns';
import jsonwebtoken from 'jsonwebtoken'


@Injectable()
export class DonacionesService {
  private readonly logger = new Logger(DonacionesService.name, { timestamp: true });

  constructor(
    @Inject(MP_CLIENT)
    private readonly mercadoPago: {
      payment: Payment,
      preapproval: PreApproval
    },

    private readonly configService: ConfigService,

    @InjectRepository(Donador)
    private readonly donadoresRepository: Repository<Donador>,

    @InjectRepository(Donacion)
    private readonly donacionesRepository: Repository<Donacion>,

    @InjectRepository(RecurringDonacion)
    private readonly recurringRepository: Repository<RecurringDonacion>,

    private readonly dataSource: DataSource,

    private readonly encryptionService: EncryptionService,

    private readonly mailerService: MailerService,

    @InjectRepository(ActionToken)
    private readonly actionTokenRepository: Repository<ActionToken>,
  ) { }



  async saveDonador(dto: CreateDonadorDto) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction()

    const nombreCompleto = `${dto.nombre} ${dto.apellidoPaterno} ${dto.apellidoMaterno}`;
    let fiscal: Fiscal | null = null;
    try {
      if (dto.needsComprobante) {
        fiscal = new Fiscal();
        const direccionEncrypted = this.encryptionService.encrypt(dto.domicilio);
        fiscal.direccionCipherText = direccionEncrypted.encrypted;
        fiscal.direccionIv = direccionEncrypted.iv;
        fiscal.direccionAuthTag = direccionEncrypted.tag;
        const rfcEncrypted = this.encryptionService.encrypt(dto.rfc);
        fiscal.rfcCipherText = rfcEncrypted.encrypted;
        fiscal.rfcIv = rfcEncrypted.iv;
        fiscal.rfcAuthTag = rfcEncrypted.tag;

        fiscal.persona = dto.tipoPersona;
        fiscal.razonSocial = dto.tipoPersona === 'moral' ? dto.razonSocial : nombreCompleto;
        fiscal.regimenFiscal = `${dto.regimenFiscal.codigo} - ${dto.regimenFiscal.regimen}`;
        fiscal.usoCfdi = `${dto.usoCfdi.codigo} - ${dto.usoCfdi.uso}`;
        await qr.manager.save(fiscal);
      }

      const donador = new Donador();
      donador.nombre = dto.nombre;
      donador.apellidoPaterno = dto.apellidoPaterno;
      donador.apellidoMaterno = dto.apellidoMaterno;
      donador.correo = dto.correo;
      donador.telefono = dto.telefono ? dto.telefono : null;
      donador.canContactMe = dto.canContactMe;
      donador.needsComprobante = dto.needsComprobante;
      if (fiscal) {
        donador.fiscal = fiscal;
      }

      await qr.manager.save(donador);
      await qr.commitTransaction();

      return donador;
    } catch (e) {
      this.logger.error(e);
      await qr.rollbackTransaction();
      throw new Error('No se pude procesar esta donación')
    } finally {
      await qr.release();
    }
  }



  async processOneTimeDonation(body: BodyOneTimeDonationArgs) {
    const { donacion, donador } = body;
    const fees = this.roundToTwo(this.calculateFees(donacion.amount));

    try {
      const res = await this.mercadoPago.payment.create({
        body: {
          transaction_amount: donacion.acceptedFees ? donacion.amount + fees : donacion.amount,
          token: donacion.token,
          description: 'Donación única a Conquistando Sonrisas A.C.',
          installments: 1,
          payment_method_id: donacion.payment_method_id,
          issuer_id: donacion.issuer_id,
          external_reference: donador.donadorId,
          payer: {
            first_name: donador.nombre,
            last_name: donador.apellido,
            email: donador.correo
          },
          three_d_secure_mode: 'optional',
        }
      });

      return {
        paymentId: res.id,
        threeDs: res.three_ds_info
          ? {
            externalResourceURL: res.three_ds_info.external_resource_url,
            creq: res.three_ds_info.creq
          }
          : null
      }
    } catch (e) {
      this.logger.error(e);
      throw new Error('Hubo un problema al procesar la donación');
    }

  }



  async processMonthlyDonation(body: BodyMonthlyDonationArgs) {
    const { donacion, donador } = body;
    const fees = this.roundToTwo(this.calculateFees(donacion.amount));

    try {
      const res = await this.mercadoPago.preapproval.create({
        body: {
          preapproval_plan_id: this.configService.get<string>('DONACIONES_RECURRENTES_PREAPPROVAL_PLAN_ID'),
          card_token_id: donacion.card_token_id,
          payer_email: donador.correo,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            currency_id: 'MXN',
            transaction_amount: donacion.acceptedFees ? donacion.amount + fees : donacion.amount
          },
        }
      })

      return {
        suscriptionId: res.id,
        status: res.status,
        reason: res.reason,
        amount: res.auto_recurring?.transaction_amount,
        nextPayment: res.next_payment_date,
      };
    } catch (e) {
      this.logger.error(e);
      throw new Error('Hubo un problema al procesar la donación recurrente');
    }
  }



  async saveDonacion(type: 'one-time' | 'monthly', donacionDetails: PaymentResponse) {
    if (!donacionDetails.id || !donacionDetails.transaction_amount) {
      throw new Error('Invalid')
    }

    const donadorId = donacionDetails.external_reference;
    const donador = await this.donadoresRepository.findOneByOrFail({ id: donadorId });

    const donacion = new Donacion();
    donacion.paymentId = donacionDetails.id;
    donacion.monto = donacionDetails.transaction_amount;
    donacion.donador = donador;
    donacion.type = type;

    const createdDonacion = await this.donacionesRepository.save(donacion);
    return {
      donacion: createdDonacion,
      donador
    }
  }



  async getDonacionByPaymentId(paymentId: number) {
    return this.donacionesRepository.findOneBy({
      paymentId
    });
  }



  getPaymentDetails(paymentId: number) {
    return this.mercadoPago.payment.get({
      id: paymentId
    })
  }


  async getSuscriptionDetails(preapprovalId: string) {
    return this.mercadoPago.preapproval.get({
      id: preapprovalId
    })
  }



  async sendThankYouEmailForDonacion(donador: Donador, donacion: Donacion) {
    // createToken?
    return this.mailerService.sendMail({
      to: donador.correo,
      from: this.configService.getOrThrow<string>('EMAIL_USER'),
      subject: '¡Muchas gracias por tu donación!',
      template: 'agradecimiento-donacion',
      context: {
        to: donador.correo,
        nombre: donador.nombre,
        type: donacion.type === 'monthly' ? 'mensual' : 'única',
        monto: Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(donacion.monto)
      }
    })
  }


  private async generateActionToken(idRecurringDonacion: string, action: string, reason: string) {
    const actionToken = new ActionToken();
    actionToken.idRecurringDonacion = idRecurringDonacion;
    actionToken.action = action;
    actionToken.reason = reason;
    actionToken.expiresAt = addHours(new Date(), 48);
    const saved = await this.actionTokenRepository.save(actionToken)
    return jsonwebtoken.sign({
      sub: saved.id,
    },
      this.configService.getOrThrow<string>('JWT_SECRET'),
      {
        expiresIn: '48h'
      }
    )
  }



  async sendThankYouEmailForRecurringDonacion(donador: Donador, recurring: RecurringDonacion) {
    const token = await this.generateActionToken(recurring.id, 'cancel', 'cancel-by-email-link');
    return this.mailerService.sendMail({
      to: donador.correo,
      from: this.configService.getOrThrow<string>('EMAIL_USER'),
      subject: '¡Muchas gracias por registrarte como donador recurrente!',
      template: 'agradecimiento-donacion-recurring',
      context: {
        phone: this.configService.getOrThrow<string>('CONTACT_PHONE'),
        cancelToken: token,
        nombre: donador.nombre,
        to: donador.correo,
        textMessage: encodeURIComponent('Me gustaría cancelar mi donación recurrente'),
        monto: Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(recurring.monto)
      }
    })
  }


  async cancelarDonacionRecurrente() {
    // add id of donador in token
    // get token
    // get donador
    // get donacion and the suscriptionId
    // update suscriptionId with status of cancelled
    // return status
    // send email of cancellation
  }



  // se toma 2.89% de tarifas con base en documentacion 
  // de Mercado Libre Solidario (4. Beneficios para los Usuarios Participantes)
  // https://www.mercadolibre.com.mx/ayuda/4942
  private calculateFees(grossAmount: number) {
    return (grossAmount / 0.966476) - grossAmount;
  }



  private roundToTwo(amount: number) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }



  async getRecurringDonacion(mercadoPagoPreapprovalId: string) {
    return this.recurringRepository.findBy({
      mercadoPagoPreapprovalId
    })
  }


  async saveRecurringDonacion(details: PreApprovalResponse) {
    if (!details.external_reference) {
      throw new Error('No external reference en preapproval')
    }
    if (!details.id) {
      throw new Error('No id en preapproval');
    }

    if (!details.auto_recurring?.transaction_amount) {
      throw new Error('No transaction_amount en preapproval');
    }

    if (!details.status) {
      throw new Error('No status in preapproval');
    }

    const donador = await this.donadoresRepository.findOneByOrFail({ id: details.external_reference });

    const recurring = new RecurringDonacion();
    recurring.donador = donador;
    recurring.mercadoPagoPreapprovalId = details.id;
    recurring.frequencyType = details.auto_recurring?.frequency_type || 'months';
    recurring.frequency = details.auto_recurring?.frequency || 1;
    recurring.monto = details.auto_recurring?.transaction_amount;
    recurring.status = details.status;

    const savedRecurring = await this.recurringRepository.save(recurring)

    return { donador, recurring: savedRecurring };
  }



  async generateReportOfDonacionesOfCurrentMonth() {
    // select donaciones of current month
    // select donadores
    // decrypt fiscal data of donadores that need comprobante
    // create file stream, save it in server?
    // send file stream to emails in config list
    // ** if sending email fails, file would be in server
  }



  async sendReportToDirectivos() {
    // generate report
    // send it to emails configured in env
  }

}


type BodyOneTimeDonationArgs = {
  donacion: Pick<PaymentCreateRequest,
    'token' | 'payment_method_id' | 'issuer_id'> & {
      amount: number,
      acceptedFees: boolean
    },
  donador: {
    correo: string,
    nombre: string,
    apellido: string,
    donadorId: string,
  }
}


type BodyMonthlyDonationArgs = {
  donacion: Pick<PreApprovalRequest, 'card_token_id'> & {
    amount: number,
    acceptedFees: boolean,
  },
  donador: {
    correo: string,
    nombre: string,
    apellido: string,
    donadorId: string,
  }
}