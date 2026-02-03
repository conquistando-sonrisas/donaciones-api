import { Body, Controller, Headers, HttpCode, Logger, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { MercadoPagoWebhookGuard } from './mercado-pago-webhook.guard';
import { DonacionesService } from 'src/donaciones/donaciones.service';
import { CreatePaymentWebhookDto, CreatePaymentWebhookSignaturesDto } from './dtos/create-payment-webook.dto';
import { PaymentResponse } from 'mercadopago/dist/clients/order/commonTypes';

@Controller({
  path: 'webhooks',
  version: '1'
})
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name, { timestamp: true })

  constructor(
    private readonly donacionesService: DonacionesService
  ) { }



  @UseGuards(MercadoPagoWebhookGuard)
  @Post('/mercado-pago/:type')
  @HttpCode(200)
  async handleMercadoPagoPaymentUpdate(
    @Body() body: CreatePaymentWebhookDto,
    @Param('type') donacionType: 'one-time' | 'monthly'
  ) {
    const paymentId = body.data.id;
    const existing = await this.donacionesService.getDonacion(paymentId);

    if (existing) {
      return;
    }

    const details = await this.donacionesService.getPaymentDetails(paymentId);
    const { donacion, donador } = await this.donacionesService.saveDonacion(donacionType, details);

    setImmediate(async () => {
      try {
        await this.donacionesService.sendThankYouEmailTo(donador, donacion);
      } catch (e) {
        this.logger.error(e);
      }
    })

    return;
  }
}
