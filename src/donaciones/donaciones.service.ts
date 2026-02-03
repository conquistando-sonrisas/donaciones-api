import { Inject, Injectable, Logger } from '@nestjs/common';
import { MP_CLIENT } from './mercado-pago.constants';
import { Payment, PreApproval } from 'mercadopago';
import { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types';
import { ConfigService } from '@nestjs/config';
import { PreApprovalRequest } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { InjectRepository } from '@nestjs/typeorm';
import { Donador } from './entities/donador.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateDonadorDto } from './dtos/create-donor.dto';
import { Fiscal } from './entities/fiscal.entity';
import { EncryptionService } from 'src/encryption/encryption.service';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { Donacion } from './entities/donacion.entity';


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

    private readonly dataSource: DataSource,

    private readonly encryptionService: EncryptionService
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
    const donador = await this.donadoresRepository.findOneBy({ id: donadorId });

    if (!donador) {
      this.logger.error(`No se encontró donador con id: ${donadorId}`);
      throw new Error('Donador no encontrado');
    }

    const donacion = new Donacion();
    donacion.paymentId = donacionDetails.id;
    donacion.monto = donacionDetails.transaction_amount;
    donacion.donador = donador;
    donacion.type = type;
    
    const created = await this.donacionesRepository.save(donacion);
    return {
      donacion,
      donador
    }
  }



  async getDonacion(paymentId: number) {
    return this.donacionesRepository.findOneBy({
      paymentId
    });
  }



  getPaymentDetails(paymentId: number) {
    return this.mercadoPago.payment.get({
      id: paymentId
    })
  }



  async sendThankYouEmailTo(donador: Donador, donacion: Donacion) {
    // mailto: donador.correo
    // message: gracias por tu donacion {type} de {monto}
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