import { Logger } from '@nestjs/common'
import { ConfigSourceFactory } from '../shared-components/providers'
import { LogLevel } from '../shared-components/models'

/** A log-level aware logger which only logs debug statements when LOG_LEVEL is set to debug. */
export class CustomLogger extends Logger {
  private logLevel: LogLevel

  constructor(ConfigSource = ConfigSourceFactory.getConfigSourceForEnvironment()) {
    super()
    this.logLevel = ConfigSource.getLogLevel()
  }

  debug(message: string) {
    if (this.logLevel === LogLevel.debug) {
      super.debug(message)
    }
  }
}
