import { Module, Provider } from '@nestjs/common';
import { DonacionesController } from './donaciones.controller';
import { DonacionesService } from './donaciones.service';
import { MP_CLIENT } from './mercado-pago.constants';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment, PreApproval } from 'mercadopago';

const mercadoPagoProvider: Provider = {
  provide: MP_CLIENT,
  useFactory: (configService: ConfigService) => {
    const paymentConfig = new MercadoPagoConfig({
      accessToken: configService.getOrThrow<string>('DONACIONES_UNICAS_ACCESS_TOKEN'),
      options: {
        timeout: 5000
      }
    })
    const preapprovalConfig = new MercadoPagoConfig({
      accessToken: configService.getOrThrow<string>('DONACIONES_RECURRENTES_ACCESS_TOKEN'),
      options: {
        timeout: 5000
      }
    })
    return {
      payment: new Payment(paymentConfig),
      preapproval: new PreApproval(preapprovalConfig)
    }
  },
  inject: [ConfigService]
}

@Module({
  controllers: [DonacionesController],
  providers: [
    DonacionesService,
    mercadoPagoProvider
  ]
})
export class DonacionesModule { }
