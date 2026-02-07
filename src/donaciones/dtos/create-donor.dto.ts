import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";


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
export class CreateDonadorDto {

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  nombre: string;


  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  apellidoPaterno: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  apellidoMaterno: string | null;


  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  correo: string;


  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  telefono: string;


  @IsBoolean()
  needsComprobante: boolean;


  @ValidateIf(o => o.needsComprobante === true)
  @IsString()
  @IsNotEmpty()
  rfc: string;


  @ValidateIf(o => o.needsComprobante === true)
  @ValidateNested()
  usoCfdi: UsoCfdiDto;


  @ValidateIf(o => o.needsComprobante === true)
  @ValidateNested()
  regimenFiscal: RegimenFiscalDto;


  @ValidateIf(o => o.needsComprobante === true)
  @IsString()
  @IsNotEmpty()
  domicilio: string;


  @ValidateIf(o => o.needsComprobante === true)
  @IsString()
  @IsIn(['moral', 'fisica'])
  tipoPersona: string;

  @ValidateIf(o => o.tipoPersona === 'moral')
  @IsString()
  @IsNotEmpty()
  razonSocial: string;

  @IsBoolean()
  canContactMe: boolean;

}

