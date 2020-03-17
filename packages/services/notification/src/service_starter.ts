import { bootstrapInternalApi } from './internal-api/create_email'

import './core'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapNotificationService() {
  killProcessOnSignal()
  bootstrapInternalApi()
}
