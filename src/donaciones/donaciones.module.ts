import { Module, Provider } from '@nestjs/common';
import { DonacionesController } from './donaciones.controller';
import { DonacionesService } from './donaciones.service';
import { MP_CLIENT } from './mercado-pago.constants';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment, PreApproval } from 'mercadopago';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donador } from './entities/donador.entity';
import { Donacion } from './entities/donacion.entity';
import { Fiscal } from './entities/fiscal.entity';
import { EncryptionModule } from 'src/encryption/encryption.module';

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

const throttlerProvider: Provider = {
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}

@Module({
  imports: [
    EncryptionModule,
    TypeOrmModule.forFeature([Donador, Donacion, Fiscal]),
  ],
  controllers: [DonacionesController],
  providers: [
    DonacionesService,
    mercadoPagoProvider,
    throttlerProvider,
  ],
  exports: [DonacionesService]
})
export class DonacionesModule { }
