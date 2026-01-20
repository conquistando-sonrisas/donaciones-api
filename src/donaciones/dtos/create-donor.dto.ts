import { IsBoolean, IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";


export class CreateDonorDto {

  @IsString()
  @IsNotEmpty()
  nombre: string;
  

  @IsString()
  @IsNotEmpty()
  apellido: string;
  

  @IsEmail()
  @IsNotEmpty()
  correo: string;
  

  @IsNotEmpty()
  celular: string;
  

  @IsBoolean()
  requiresComprobanteFiscal: boolean;
  

  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  rfc: string;
  

  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  usoCfdi: string;
  

  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  regimenFiscal: string;
  

  @ValidateIf(o => o.requiresComprobanteFiscal === true)
  @IsString()
  @IsNotEmpty()
  domicilioFiscal: string;
  
}