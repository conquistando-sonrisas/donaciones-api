import { Module } from '@nestjs/common';
import { DonacionesModule } from './donaciones/donaciones.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DonacionesModule,
    ConfigModule.forRoot({ isGlobal: true })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
