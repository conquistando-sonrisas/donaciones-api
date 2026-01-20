import { Body, Controller, Post } from '@nestjs/common';
import { CreateOneTimeDonacionDto } from './dtos/create-donacion.dto';

@Controller('donaciones')
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
