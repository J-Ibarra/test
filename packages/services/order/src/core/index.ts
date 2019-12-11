import { setupModel } from '@abx/db-connection-utils'

import setupOrderDataModel from './model'

setupModel(setupOrderDataModel)

export * from './order-queries'
export * from './transaction-queries'
