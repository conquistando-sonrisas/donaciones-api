import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { DonacionesModule } from 'src/donaciones/donaciones.module';



@Module({
  imports: [DonacionesModule],
  providers: [WebhooksService],
  controllers: [WebhooksController]
})
export class WebhooksModule {}
