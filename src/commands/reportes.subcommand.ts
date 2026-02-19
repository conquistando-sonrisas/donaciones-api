import { randomBytes } from "crypto";
import { formatISO } from "date-fns";
import { CommandRunner, SubCommand, Option } from "nest-commander";
import { DonacionesService } from "src/donaciones/donaciones.service";
import path from 'node:path'
import { createWriteStream, existsSync } from "node:fs";
import { format } from '@fast-csv/format';
import { mkdir } from "node:fs/promises";
import { EncryptionService } from "src/encryption/encryption.service";
import { ConfigService } from "@nestjs/config";
import { finished } from "node:stream/promises";



@SubCommand({
  name: 'reporte:generar',
  description: 'Generación de reporte acerca de las donaciones del mes actual'
})
export class ReportesCommand extends CommandRunner {

  constructor(
    private readonly donacionesService: DonacionesService,
    private readonly encryptionService: EncryptionService,
    private readonly config: ConfigService
  ) {
    super()
  }

  async run(passedParams: string[], options?: Record<string, any>) {
    const donaciones = await this.donacionesService.getDonacionesOfCurrentMonth();
    const date = formatISO(new Date(), { representation: 'date' })
    const randomStr = randomBytes(8).toString('hex');
    const filepath = path.join(process.cwd(), 'reportes');

    if (!existsSync(filepath)) {
      await mkdir(filepath);
    }

    const filename = `report-${date}-${randomStr}.csv`;
    const reportPath = path.join(filepath, filename);
    const writeStream = createWriteStream(reportPath, {
      flags: 'w',
      encoding: 'utf-8',
      autoClose: true
    });

    const csvStream = format({ headers: true });

    csvStream.pipe(writeStream);

    for (let i = 0; i < donaciones.length; i++) {
      const donacion = donaciones[i];
      const donador = donacion.donador;
      const fiscal = donacion.donador.fiscal;

      csvStream.write({
        nombre: `${donador.nombre} ${donador.apellidoPaterno} ${donador.apellidoMaterno}`,
        correo: donador.correo,
        telefono: donador.telefono ? donador.telefono : '',
        'tipo donacion': donacion.type === 'one-time' ? 'Única' : 'Mensual',
        monto: Intl.NumberFormat('es-MX', { currency: 'MXN', style: 'currency' }).format(donacion.monto),
        fecha: donacion.createdAt.toLocaleDateString('es-MX'),
        '¿podemos contactarlo?': donador.canContactMe ? 'Sí' : 'No',
        '¿necesita comprobante?': donador.needsComprobante ? 'Sí' : 'No',
        persona: fiscal ? fiscal.persona : '',
        'Razón social': fiscal ? fiscal.razonSocial : '',
        'Regimen fiscal': fiscal ? fiscal.regimenFiscal : '',
        'Uso CFDI': fiscal ? fiscal.usoCfdi : '',
        RFC: fiscal ? this.encryptionService.decrypt({
          iv: fiscal.rfcIv,
          tag: fiscal.rfcAuthTag,
          encrypted: fiscal.rfcCipherText
        }) : '',
        'Dirección': fiscal ? this.encryptionService.decrypt({
          iv: fiscal.direccionIv,
          tag: fiscal.direccionAuthTag,
          encrypted: fiscal.direccionCipherText
        }) : ''
      });
    }

    csvStream.end();
    await finished(csvStream);

    if (options?.enviar) {
      const res = await this.donacionesService.sendReportFile(
        reportPath,
        this.config.getOrThrow<string>('EMAILS_TO_SEND_REPORT').split(',')
      );
      console.log(res)
    }
  }


  @Option({
    flags: '--enviar',
    description: 'Cuenta de correos al que se debe enviar reporte'
  })
  parseEmailsToSendTo() {
    return true
  }
}