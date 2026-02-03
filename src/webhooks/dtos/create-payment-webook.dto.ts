import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";

class NestedDataDto {

  @IsDefined()
  @IsNumber()
  id: number;
}

export class CreatePaymentWebhookDto {

  @IsDefined()
  @ValidateNested()
  @Type(() => NestedDataDto)
  data: NestedDataDto;
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

