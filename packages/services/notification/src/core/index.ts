import { setupModel } from '@abx-utils/db-connection-utils'

import setupNotificationBalance from './models'

setupModel(setupNotificationBalance)

export * from './lib/email'
