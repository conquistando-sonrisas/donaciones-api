import { Inject, Injectable } from '@nestjs/common';
import { MP_CLIENT } from './mercado-pago.constants';
import { Payment, PreApproval } from 'mercadopago';
import { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types';
import { ConfigService } from '@nestjs/config';
import { PreApprovalRequest } from 'mercadopago/dist/clients/preApproval/commonTypes';


@Injectable()
export class DonacionesService {

  constructor(
    @Inject(MP_CLIENT)
    private readonly mercadoPago: {
      payment: Payment,
      preapproval: PreApproval
    },
    private readonly configService: ConfigService) { }



  async processOneTimeDonation(body: BodyOneTimeDonationArgs) {
    const { donacion, donador } = body;
    const fees = this.calculateFees(donacion.amount);

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
    } catch (err) {
      // log err
      throw new Error('Hubo un problema al procesar la donación');
    }

  }



  async processMonthlyDonation(body: BodyMonthlyDonationArgs) {
    const { donacion, donador } = body;
    const fees = this.calculateFees(donacion.amount);

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
    } catch (err) {
      // log err
      throw new Error('Hubo un problema al procesar la donación recurrente');
    }
  }


  // se toma 2.89% de tarifas con base en documentacion 
  // de Mercado Libre Solidario (4. Beneficios para los Usuarios Participantes)
  // https://www.mercadolibre.com.mx/ayuda/4942
  private calculateFees(grossAmount: number) {
    return (grossAmount / 0.966476) - grossAmount;
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