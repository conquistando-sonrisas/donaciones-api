import { BadRequestException, Body, Controller, Headers, HttpCode, Logger, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { MercadoPagoWebhookGuard } from './mercado-pago-webhook.guard';
import { DonacionesService } from 'src/donaciones/donaciones.service';
import { MercadoPagoWebhookDto, CreatePaymentWebhookSignaturesDto } from './dtos/create-payment-webook.dto';
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
    @Body() body: MercadoPagoWebhookDto,
    @Param('type') donacionType: 'one-time' | 'monthly'
  ) {

    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const existing = await this.donacionesService.getDonacionByPaymentId(paymentId);

      if (existing) {
        return;
      }

      const details = await this.donacionesService.getPaymentDetails(paymentId);
      console.log(JSON.stringify(details, null, 2));
      const { donacion, donador } = await this.donacionesService.saveDonacion(donacionType, details);

      setImmediate(async () => {
        try {
          await this.donacionesService.sendThankYouEmailForDonacion(donador, donacion);
        } catch (e) {
          this.logger.error(e);
        }
      })

      return;
    }


    if (body.type === 'subscription_preapproval') {
      const mercadoPagoPreapprovalId = body.id.toString();
      const existingRecurringDonacion = await this.donacionesService.getRecurringDonacion(mercadoPagoPreapprovalId);

      if (existingRecurringDonacion) return;

      const details = await this.donacionesService.getSuscriptionDetails(mercadoPagoPreapprovalId);
      console.log(JSON.stringify(details, null, 2));

      const { recurring, donador } = await this.donacionesService.saveRecurringDonacion(details);
      setImmediate(async () => {
        try {

          await this.donacionesService.sendThankYouEmailForRecurringDonacion(donador, recurring);
        } catch (e) {
          this.logger.error(e);
        }
      })
      return;
    }

    console.log('UNHANDLE WEBHOOK', JSON.stringify(body, null, 2));
    
    return;
  }

}
