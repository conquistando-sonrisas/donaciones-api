import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class EncryptionService {

  constructor(
    private readonly config: ConfigService
  ) { }


  encrypt(text: string) {
    const iv = randomBytes(16);
    const secret = Buffer.from(this.config.getOrThrow('ENCRYPTION_SECRET'), 'base64');
    const cipher = createCipheriv('aes-256-gcm', secret, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf-8'),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString('base64'),
      encrypted: encrypted.toString('base64'),
      tag: tag.toString('base64')
    };
  }



  async decrypt() {

  }
}
