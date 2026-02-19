#!/usr/bin/env node

import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module";


// donaciones reporte --generar --enviar? --confirm?
// donaciones recurrentes <correo>  --confirm?
async function bootstrap() {
  await CommandFactory.run(AppModule, ['warn', 'error', 'debug']);
}


bootstrap();