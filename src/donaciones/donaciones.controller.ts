import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { CreateOneTimeDonacionDto as CreateDonacionDto } from './dtos/create-donacion.dto';
import { DonacionesService } from './donaciones.service';
import { ActionTokenGuard } from './action-token.guard';
import type { Request } from 'express';



@Controller({
  path: 'donaciones',
  version: '1'
})
export class DonacionesController {

  constructor(
    private readonly donacionesService: DonacionesService
  ) { }

  @Post('/one-time')
  async handleOneTimeDonacion(@Body() body: CreateDonacionDto) {
    const donador = await this.donacionesService.saveDonador(body.donador);

    const paymentDetails = await this.donacionesService.processOneTimeDonation({
      donacion: body.donacion, donador: {
        donadorId: donador.id,
        nombre: donador.nombre,
        apellido: `${donador.apellidoPaterno} ${donador.apellidoMaterno}`,
        correo: donador.correo
      }
    });

    return paymentDetails;
  }



  @Post('/monthly')
  async handleMonthlyDonacion(@Body() body: CreateDonacionDto) {
    const donador = await this.donacionesService.saveDonador(body.donador);

    const paymentDetails = await this.donacionesService.processMonthlyDonation({
      donacion: body.donacion,
      donador: {
        donadorId: donador.id,
        nombre: donador.nombre,
        apellido: `${donador.apellidoPaterno} ${donador.apellidoMaterno}`,
        correo: donador.correo,
      }
    });

    return paymentDetails;
  }


  @UseGuards(ActionTokenGuard)
  @Get('/tokens/:token')
  async getDonacionWithToken(@Req() req: Request) {
    const idActionToken = (req as any).idActionToken;
    const recurring = await this.donacionesService.getRecurringDonacionByActionTokenId(idActionToken);
    return { recurring };
  }

}
