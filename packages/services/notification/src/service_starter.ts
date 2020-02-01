import { bootstrapInternalApi } from './internal-api/create_email'

import './core'

export async function bootstrapNotificationService() {
  bootstrapInternalApi()
}
