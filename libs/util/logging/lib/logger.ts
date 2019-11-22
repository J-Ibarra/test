import { isObject } from 'lodash'
import moment from 'moment'
import { noticeError } from 'newrelic'
import winston, { Logger as WinstonLogger } from 'winston'
import { LogLevel } from './model'

/** The main logging, abstracting away the actual logger implementation used. */
export class Logger {
  private static logLevel: LogLevel
  private logger: WinstonLogger
  private logJustOnlyFunction: boolean

  private constructor(logger: WinstonLogger, logJustOnlyFunction = false) {
    this.logger = logger
    this.logJustOnlyFunction = logJustOnlyFunction
  }

  public static configure(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  /** Configures Winston to send logs to the console. Other transports can be plugged in if necessary. */
  public static getInstance(service: string, context: string): Logger {
    return new Logger(
      winston.createLogger({
        format: winston.format.combine(
          winston.format.printf(
            info => `${moment().format('ddd, MMM Do YYYY, h:mm:ss')} | ${service} | ${context} | ${info.level.toUpperCase()} ${info.message}`,
          ),
          winston.format.colorize({ all: true, colors: { info: 'cyan', debug: 'blue', warn: 'yellow', error: 'red' } }),
        ),
        level: LogLevel[Logger.logLevel],
        transports: [new winston.transports.Console()],
      }),
      false,
    )
  }

  /**
   * Logs a message at info log level.
   * The message will be displayed in logs only if logger has been configured with 'info' or 'debug' log level.
   */
  public info(message: any) {
    if (!this.logJustOnlyFunction) {
      this.logMessage(message, this.logger.info)
    }
  }

  /**
   * Logs a message at debug log level.
   * The message will be displayed in logs only if logger has been configured with 'debug' log level.
   */
  public debug(message: any) {
    if (!this.logJustOnlyFunction) {
      this.logMessage(message, this.logger.debug)
    }
  }

  /**
   * Logs a message at error log level.
   * The message will be displayed regardless of the log level that the logger has been configured with.
   */
  public error(message: any) {
    if (!this.logJustOnlyFunction) {
      if (typeof message === 'string') {
        try {
          throw new Error(message)
        } catch (e) {
          message = e
        }
      }

      this.logMessage(message, this.logger.error)
    }
  }

  /**
   * Logs a message at warn log level.
   * The message will be displayed in logs only if logger has been configured with 'warn' or lower log level.
   */
  public warn(message: any) {
    if (!this.logJustOnlyFunction) {
      this.logMessage(message, this.logger.warn)
    }
  }

  /**
   * Logs a message at only log level.
   * To trigger this function you must pass in true to new Logger (). It will stop all other levels of logs and only display this.
   * Used for development only to silence other logs
   */
  public only(message: any) {
    if (this.logJustOnlyFunction) {
      this.logMessage(message, this.logger.verbose)
    }
  }

  private logMessage(message: any, logFunction: (message: string) => void) {
    if (message instanceof Error) {
      noticeError(message)
      message = `Error: ${message.message}, Name: ${message.name}, Stack: ${message.stack}`
    }

    const formattedMessage = isObject(message) ? JSON.stringify(message) : message

    logFunction(formattedMessage)
  }
}
