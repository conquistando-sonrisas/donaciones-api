import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";


export class RegimenFiscalDto {

  @IsString()
  @IsNotEmpty()
  regimen: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}


export class UsoCfdiDto {

  @IsString()
  @IsNotEmpty()
  uso: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}
export class CreateDonorDto {

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  nombre: string;


  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  apellido: string;


  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  correo: string;


  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  telefono: string;


  @IsBoolean()
  requiresFactura: boolean;


  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  rfc: string;


  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @ValidateNested()
  usoCfdi: UsoCfdiDto;


  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @ValidateNested()
  regimenFiscal: RegimenFiscalDto;


  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  domicilio: string;

}

