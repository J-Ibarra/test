import { bootstrapInternalApi } from './internal-api/create_email'

import './core'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { bootstrapRestApi } from './rest-api'

export async function bootstrapNotificationService() {
  killProcessOnSignal()
  bootstrapRestApi()
  bootstrapInternalApi()
}
