import { AbstractError } from '@abx-types/error'

/** Thrown when an API Endpoint call is unsuccessful. */
export class ApiProviderError extends AbstractError {
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
    super('ApiProviderError', message, { severity: 3, status: 500, ...meta })
  }
}
