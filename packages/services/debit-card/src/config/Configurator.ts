import { NestFastifyApplication } from '@nestjs/platform-fastify'

/** Defines the blueprint for an app configurator, handling setup of a single configuration. */
export interface Configurator {

  /** Handles the single responsibility of configuring a specific aspect of the application. */
  configure(app: NestFastifyApplication)
}
