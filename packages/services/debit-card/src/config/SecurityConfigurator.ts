import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from '@nestjs/common'
import helmet from 'helmet'

import { Environment } from '../shared-components/models'
import { ConfigSourceFactory } from '../shared-components/providers'
import { Configurator } from './Configurator'

const ENVIRONMENTS_WITH_LOCALHOST_ORIGIN_ENABLED: string[] = [
  Environment[Environment.development],
  Environment[Environment.integration],
  Environment[Environment.uat],
]

export class SecurityConfigurator implements Configurator {
  private logger = new Logger('SecurityConfigurator')

  /**
   * Configures CORS based on the current environment.
   * For dev, integration and uat environments http://localhost:1234 is also an allowed origin.
   */
  public configure(app: NestFastifyApplication) {
    this.setupCors(app)
    app.use(helmet())
  }

  private setupCors(app: NestFastifyApplication) {
    const uiDomain = ConfigSourceFactory.getConfigSourceForEnvironment().getUserInterfaceDomain()
    this.logger.log(`Enabling CORS for ${uiDomain}`)

    app.enableCors({
      origin: ENVIRONMENTS_WITH_LOCALHOST_ORIGIN_ENABLED.includes(process.env
        .ENV as string)
        ? [uiDomain, 'http://localhost:1234']
        : 'http://localhost:1234',
      credentials: true,
      allowedHeaders: ['x-kms-authentication', 'content-type', 'kbe_token'],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    })
  }
}
