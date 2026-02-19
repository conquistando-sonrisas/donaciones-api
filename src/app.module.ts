import { Module } from '@nestjs/common';
import { DonacionesModule } from './donaciones/donaciones.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donador } from './donaciones/entities/donador.entity';
import { Donacion } from './donaciones/entities/donacion.entity';
import { Fiscal } from './donaciones/entities/fiscal.entity';
import { EncryptionModule } from './encryption/encryption.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import path from 'node:path';
import { RecurringDonacion } from './donaciones/entities/recurring-donacion.entity';
import { ActionToken } from './donaciones/entities/action-token.entity';
import { ReportsRunnerCommand } from './commands/donaciones.command';



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
        entities: [
          Donador,
          Donacion,
          Fiscal,
          RecurringDonacion,
          ActionToken
        ],
        synchronize: true,
      }),
      inject: [ConfigService]
    }),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('EMAIL_HOST'),
          port: config.getOrThrow<number>('EMAIL_PORT'),
          tls: {
            rejectUnauthorized: false,
          },
          secure: config.getOrThrow<number>('EMAIL_PORT') === 465,
          auth: {
            user: config.getOrThrow<string>('EMAIL_USER'),
            pass: config.getOrThrow<string>('EMAIL_PASS')
          }
        }
      }),
      inject: [ConfigService]
    }),
    WebhooksModule,
  ],
  controllers: [],
  providers: [
    ...ReportsRunnerCommand.registerWithSubCommands()
  ],
})
export class AppModule { }
