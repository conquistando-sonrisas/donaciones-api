import { Module } from '@nestjs/common';
import { DonacionesModule } from './donaciones/donaciones.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donador } from './donaciones/entities/donador.entity';
import { Donacion } from './donaciones/entities/donacion.entity';
import { Fiscal } from './donaciones/entities/fiscal.entity';
import { EncryptionModule } from './encryption/encryption.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    DonacionesModule,
    EncryptionModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{
        name: 'donaciones',
        ttl: 60_000,
        limit: 10 
      }]
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [Donador, Donacion, Fiscal],
        synchronize: true,
      }),
      inject: [ConfigService]
    }),
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
