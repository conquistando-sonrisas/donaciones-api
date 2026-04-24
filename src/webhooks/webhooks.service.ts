import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name, { timestamp: true });

  constructor(
    private readonly configService: ConfigService
  ) { }

  isHashValid(hash: string, manifest: string, donacionType: 'one-time' | 'monthly') {
    let secretKey = ''
    if (donacionType === 'one-time') {
      secretKey = this.configService.getOrThrow<string>('WEBHOOK_DONACIONES_UNICAS_KEY')
    } else if (donacionType === 'monthly') {
      secretKey = this.configService.getOrThrow<string>('WEBHOOK_DONACIONES_RECURRENTES_KEY')
    } else {
      return false;
    }

    const sha = this.generateSha(manifest, secretKey);

    return sha === hash;
  }

  getManifestString(dataId: string, requestId: string, timestamp: string) {
    return `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  }


  private generateSha(manifest: string, secretKey: string) {
    const hmac = createHmac('sha256', secretKey);
    hmac.update(manifest);
    return hmac.digest('hex');
  }
}
