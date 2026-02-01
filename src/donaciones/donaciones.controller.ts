import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CreateOneTimeDonacionDto } from './dtos/create-donacion.dto';
import { DonacionesService } from './donaciones.service';

@Controller({
  path: 'donaciones',
  version: '1'
})
export class DonacionesController {

  constructor(
    private readonly donacionesService: DonacionesService
  ) { }

  @Post('/one-time')
  async handleOneTimeDonacion(@Body() body: CreateOneTimeDonacionDto) {
    const donador = await this.donacionesService.saveDonador(body.donador);

    const paymentDetails = await this.donacionesService.processOneTimeDonation({
      donacion: body.donacion, donador: {
        donadorId: donador.id,
        nombre: donador.nombre,
        apellido: `${donador.apellidoPaterno} ${donador.apellidoMaterno}`,
        correo: donador.correo
      }
    })

    return paymentDetails;
  }


  @Post('/monthly')
  handleMonthlyDonacion() {
    return 'monthly'
  }

}
