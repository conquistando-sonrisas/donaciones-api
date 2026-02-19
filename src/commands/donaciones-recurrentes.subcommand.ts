import { CommandRunner, SubCommand, Option } from "nest-commander";


@SubCommand({
  name: 'recurrentes:cancelar',
  description: 'Administración de donadores recurrentes',
})
export class DonacionesRecurrentesRunner extends CommandRunner {

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    if (options?.confirm) {
      console.log('confirmar cancelacion')
    } else {
      console.log('lista de suscripciones de este correo')
    }
    // donador full name | ...datos fiscales... | ...datos donacion...
  }


  @Option({
    flags: '-c, --confirm [boolean]',
    description: 'Confirmar acción'
  })
  parseConfirm(val: boolean) { }


  @Option({
    flags: '--correo <correo>',
    description: 'Correo del donador recurrente'
  })
  parseEmail(val: string) {
    return val;
  }

}