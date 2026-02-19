import { Command, CommandRunner } from "nest-commander";
import { ReportesCommand } from "./reportes.subcommand";
import { DonacionesRecurrentesRunner } from "./donaciones-recurrentes.subcommand";



@Command({
  name: 'donaciones',
  description: 'CLI para realizar algunas operaciones relacionadas a donaciones',
  subCommands: [ReportesCommand, DonacionesRecurrentesRunner]
})
export class ReportsRunnerCommand extends CommandRunner {

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    this.command.outputHelp();
  }
}