import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

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



  decrypt({ iv, encrypted, tag }: { iv: string, encrypted: string, tag: string }) {
    const secret = Buffer.from(this.config.getOrThrow('ENCRYPTION_SECRET'), 'base64');
    const decipher = createDecipheriv('aes-256-gcm', secret, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final()
    ]).toString('utf-8');
  }
}
