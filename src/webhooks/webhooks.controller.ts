import { BadRequestException, Body, Controller, Headers, HttpCode, HttpException, InternalServerErrorException, Logger, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { DonacionesService } from 'src/donaciones/donaciones.service';
import { MercadoPagoWebhookDto } from './dtos/create-payment-webook.dto';
import { PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { WebhooksService } from './webhooks.service';
import type { Request } from 'express';



@Controller({
  path: 'webhooks',
  version: '1'
})
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name, { timestamp: true })

  constructor(
    private readonly donacionesService: DonacionesService,
    private readonly webhookService: WebhooksService
  ) { }



  @Post('/mercado-pago/:type')
  @HttpCode(200)
  async handleMercadoPagoPaymentUpdate(
    // @Body() body: MercadoPagoWebhookDto,
    @Param('type') donacionType: 'one-time' | 'monthly',
    @Req() req: Request
  ) {
    try {
      const signature = req.headers['x-signature'];
      const requestId = req.headers['x-request-id'];

      this.logger.log({ signature, requestId });

      if (!signature || !requestId) {
        this.logger.log(`Ignoring malformed req no signature or requestId`)
        return;
      }

      const parts = Object.fromEntries(
        (signature as string).split(',').map(p => p.split('=').map(s => s.trim()))
      );
      const timestamp = parts['ts'];
      const hash = parts['v1'];
      const dataId = req.body?.data?.id;
      const action = req.body?.action;
      const type = req.body?.type;
      this.logger.log(`body: ${JSON.stringify(req.body)}`);
      if (!timestamp || !hash || !dataId) {
        this.logger.log(`Ignoring malformed req: ${JSON.stringify({ action, type, donacionType })} (no ts hash or dataid)`)
        return 'received';
      }
      this.logger.log({ dataId, timestamp, hash })
      const manifest = this.webhookService.getManifestString(dataId, requestId as string, timestamp);
      const isReqAuthentic = () => this.webhookService.isHashValid(hash, manifest, donacionType);

      if (action === 'created' && type === 'subscription_preapproval') {
        // save recurring donation
        const existingRecurring = await this.donacionesService.getRecurringDonacionByMercadoPagoId(dataId);
        if (existingRecurring) {
          return 'received';
        }

        if (!isReqAuthentic()) {
          throw new BadRequestException();
        }

        const details = await this.donacionesService.getSuscriptionDetails(dataId);
        const { recurring, donador } = await this.donacionesService.saveRecurringDonacion(details);

        setImmediate(async () => {
          try {
            await this.donacionesService.sendThankYouEmailForRecurringDonacion(donador, recurring);
          } catch (e) {
            this.logger.error(e);
          }
        })

      } else if (action === 'payment.created') {
        // save donation payment 
        const existingPayment = await this.donacionesService.getDonacionByPaymentId(dataId);
        if (existingPayment) {
          return 'received';
        }

        if (!isReqAuthentic()) {
          throw new BadRequestException();
        }

        const paymentDetails = await this.donacionesService.getPaymentDetails(dataId);
        let suscriptionDetails: PreApprovalResponse | null = null;
        if (donacionType === 'monthly' && paymentDetails.payer) {
          suscriptionDetails = await this.donacionesService.getSuscriptionDetailsByPayerId(Number(paymentDetails.payer.id))
        }

        const { donacion, donador } = await this.donacionesService.saveDonacion(
          donacionType, {
          payment: paymentDetails,
          suscription: suscriptionDetails
        });

        setImmediate(async () => {
          try {
            await this.donacionesService.sendThankYouEmailForDonacion(donador, donacion);
          } catch (e) {
            this.logger.error(e);
          }
        })

      } else {
        this.logger.log(`Ignoring action ${action} of type ${type}`)
      }

      return 'received'

    } catch (err) {
      if (err instanceof HttpException) throw err;

      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }

}
