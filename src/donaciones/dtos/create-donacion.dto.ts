import { IsBoolean, isBoolean, IsNotEmpty, IsNumber, IsString, Validate, ValidateNested } from "class-validator";
import { CreateDonorDto } from "./create-donor.dto";
import { Type } from "class-transformer";


export class OneTimeBodyDto {

  @IsBoolean()
  acceptedFees: boolean;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  issuer_id: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  payment_method_id: string;
}


export class CreateOneTimeDonacionDto {

  @ValidateNested()
  @Type(() => OneTimeBodyDto)
  donacion: OneTimeBodyDto;

  @ValidateNested()
  @Type(() => CreateDonorDto)
  donador: CreateDonorDto;
}
