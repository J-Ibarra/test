import { HttpStatus } from '@nestjs/common'

/**
 * The intention is to use this instead of the default {@link Error}
 * as the status can be used at the controller level and returned to the client.
 */
export class ValidationError extends Error {
  constructor(errorMessage: string, public status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(errorMessage)
  }
}
