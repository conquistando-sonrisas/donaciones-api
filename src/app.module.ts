import { Module } from '@nestjs/common';
import { DonacionesModule } from './donaciones/donaciones.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    DonacionesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{
        name: 'donaciones',
        ttl: 60_000,
        limit: 10 
      }]
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
