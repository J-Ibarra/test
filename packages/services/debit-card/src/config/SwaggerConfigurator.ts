import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from '@nestjs/common'

import { Configurator } from './Configurator'

/** Hosts Swagger API documentation on /docs endpoints. */
export class SwaggerConfigurator implements Configurator {
  private logger = new Logger('SwaggerConfigurator')

  configure(app: NestFastifyApplication) {
    const options = new DocumentBuilder()
      .setTitle('Debit Card Service')
      .setDescription('The Debit Card Service API description')
      .setVersion('0.0.1')
      .addTag('debit-card-service')
      .build()

    const document = SwaggerModule.createDocument(app, options)
    SwaggerModule.setup('api/debit-cards/docs', app, document)
    this.logger.log('Swagger setup on URL /docs')
  }
}
