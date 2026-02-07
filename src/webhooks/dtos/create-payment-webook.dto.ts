import { Type } from "class-transformer";
import { IsDefined, IsNegative, IsNotEmpty, IsNumber, IsNumberString, IsString, ValidateNested } from "class-validator";

class NestedDataDto {

  @IsDefined()
  @IsNumberString()
  id: number;
}

export class MercadoPagoWebhookDto {

  @IsDefined()
  @ValidateNested()
  @Type(() => NestedDataDto)
  data: NestedDataDto;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  action: string;

  @IsDefined()
  @IsNumberString()
  id: number;
}

export class CreatePaymentWebhookSignaturesDto {

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  'x-signature': string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  'x-request-id': string;
}

