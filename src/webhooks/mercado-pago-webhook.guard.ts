import { BadRequestException, CanActivate, ExecutionContext, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { createHmac } from "crypto";
import { Observable } from "rxjs";



@Injectable()
export class MercadoPagoWebhookGuard implements CanActivate {
  private readonly logger = new Logger(MercadoPagoWebhookGuard.name, { timestamp: true });

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const donacionType = req.params.type as 'one-time' | 'monthly';
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    if (!requestId || !signature || !donacionType) {
      throw new BadRequestException();
    }

    
    const [ts, v1] = (signature as string).split(',')
    const timestamp = ts.split('=')[1].trim();
    const hash = v1.split('=')[1].trim();
    const dataId = req.body.data.id;
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    
    const webhookSecretKey = donacionType === 'one-time'
      ? process.env.WEBHOOK_DONACIONES_UNICAS_KEY
      : process.env.WEBHOOK_DONACIONES_RECURRENTES_KEY;

    if (!webhookSecretKey) {
      this.logger.error(
        'Webhook secret key no fue definido, procura que WEBHOOK_DONACIONES_UNICAS_KEY y WEBHOOK_DONACIONES_RECURRENTES_KEY se encuentren en el archivo .env'
      )
      throw new InternalServerErrorException();
    }

    const hmac = createHmac('sha256', webhookSecretKey);
    hmac.update(manifest);
    const sha = hmac.digest('hex');
    if (sha !== hash) {
      this.logger.warn('Los hashes en la peticion son invalidos')
      return false
    }

    return true;
  }
}