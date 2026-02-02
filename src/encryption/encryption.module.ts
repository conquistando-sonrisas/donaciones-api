import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [ConfigModule],
  exports: [EncryptionService],
  providers: [EncryptionService]
})
export class EncryptionModule { }
