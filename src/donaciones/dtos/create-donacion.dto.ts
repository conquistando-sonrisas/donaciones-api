import { IsBoolean, isBoolean, IsNotEmpty, IsNumber, IsNumberString, IsString, Validate, ValidateNested } from "class-validator";
import { CreateDonadorDto } from "./create-donor.dto";
import { Type } from "class-transformer";


export class DonacionBodyDto {

  @IsBoolean()
  acceptedFees: boolean;

  @IsNumber()
  amount: number;

  @IsNumberString()
  issuer_id: number;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  payment_method_id: string;
}


export class CreateOneTimeDonacionDto {

  @ValidateNested()
  @Type(() => DonacionBodyDto)
  donacion: DonacionBodyDto;

  @ValidateNested()
  @Type(() => CreateDonadorDto)
  donador: CreateDonadorDto;
}
