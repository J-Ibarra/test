import * as _ from 'lodash'
import { AbstractError } from './index'

export class RuntimeError extends AbstractError {
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
    super('RuntimeError', message, _.merge({}, { severity: 2, status: 500 }, meta))
  }
}
