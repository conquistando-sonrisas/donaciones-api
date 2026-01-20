import { IsBoolean, isBoolean, IsNotEmpty, IsNumber, Validate, ValidateNested } from "class-validator";
import { CreateDonorDto } from "./create-donor.dto";

export class CreateOneTimeDonacionDto {

  @ValidateNested()
  oneTime: OneTimeBodyDto;

  @ValidateNested()
  donador: CreateDonorDto;
}

export class OneTimeBodyDto {

  @IsBoolean()
  acceptedFees: boolean;

  @IsNumber()
  amount: number;

  @IsNumber()
  issuer_id: number;

  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  payment_method_id: string;
}

