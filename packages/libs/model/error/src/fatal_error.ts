import { AbstractError } from './abstract_error'

export class FatalError extends AbstractError {
  constructor(
    message: string,
    meta?: {
      context?: {}
      args?: any
      severity?: number
      status?: number
      id?: string
    },
  ) {
    super('FatalError', message, { severity: 3, status: 500, ...meta })
  }
}
