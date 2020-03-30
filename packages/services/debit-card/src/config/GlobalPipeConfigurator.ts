import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger, ValidationPipe } from '@nestjs/common'

import { Configurator } from './Configurator'

/** Handles global pipe configuration for the app. */
export class GlobalPipeConfigurator implements Configurator {
  private logger = new Logger('GlobalPipeConfigurator')

  configure(app: NestFastifyApplication) {
    app.useGlobalPipes(new ValidationPipe({
      disableErrorMessages: true,
      whitelist: true,
      transform: true,
    }))

    this.logger.log('Global validation pipes configured')
  }
}
