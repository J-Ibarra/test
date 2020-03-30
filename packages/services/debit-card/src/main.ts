import FastifyCookie from 'fastify-cookie'

import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import {
  SwaggerConfigurator,
  SecurityConfigurator,
  CustomLogger,
  GlobalPipeConfigurator,
  Configurator,
} from './config'
import { AppModule } from './app/app.module'
import { Logger } from '@nestjs/common'

// To ADD configurators here
const APP_CONFIGURATORS: Configurator[] = [
  new SecurityConfigurator(),
  new SwaggerConfigurator(),
  new GlobalPipeConfigurator(),
]

const logger = new Logger('createSynchronousRedisClient')

export async function bootstrapDebitCard() {
  const fastifyAdapter = new FastifyAdapter()
  fastifyAdapter.register(FastifyCookie)

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new CustomLogger(),
    },
  )
  APP_CONFIGURATORS.forEach(configurator => configurator.configure(app))

  logger.debug(`Running app on port ${process.env.API_PORT}`)
  await app.listen(process.env.API_PORT || 3030, '0.0.0.0')
}
