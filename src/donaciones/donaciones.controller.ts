import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateOneTimeDonacionDto } from './dtos/create-donacion.dto';

@Controller({
  path: 'donaciones',
  version: '1'
})
export class DonacionesController {


  @Post('/one-time')
  handleOneTimeDonacion(@Body() body: CreateOneTimeDonacionDto) {
    return 'one-time'
  }


  @Post('/monthly')
  handleMonthlyDonacion() {
    return 'monthly'
  }

}
