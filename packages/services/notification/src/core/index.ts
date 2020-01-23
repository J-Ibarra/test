import { setupModel } from '@abx-utils/db-connection-utils'

import setupNotificationBalance from './models'

setupModel(setupNotificationBalance)

export * from './lib/email'
export * from './lib/trade_confirmation/create_trade_confirmation_email'
