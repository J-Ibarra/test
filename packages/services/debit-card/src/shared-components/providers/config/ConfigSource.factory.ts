import { Environment } from '../../models'
import {
  ConfigSource,
  DeployedEnvironmentConfigSource,
  LocalDevConfigSource,
  LocalTestConfigSource,
  CiTestConfigSource,
  LocalE2eTestConfigSource,
} from './source'
import { Logger } from '@nestjs/common'

/** A mechanism for retrieving the right {@link ConfigSource} to use based on the current runtime environment. */
export class ConfigSourceFactory {
  static logger = new Logger('ConfigSourceFactory')

  static getConfigSourceForEnvironment(): ConfigSource {
    if (process.env.ENV === Environment.development) {
      return new LocalDevConfigSource()
    } else if (process.env.ENV === 'TEST') {
      return new LocalTestConfigSource()
    } else if (process.env.ENV === 'e2e-local') {
      return new LocalE2eTestConfigSource()
    } else if (process.env.ENV === 'CI') {
      return new CiTestConfigSource()
    }

    ConfigSourceFactory.logger.debug('Using Deployed Environment Config')
    return new DeployedEnvironmentConfigSource()
  }
}
