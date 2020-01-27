import { setupModel } from '@abx-utils/db-connection-utils'

import setupAccountModel from './models'

setupModel(setupAccountModel)

export * from './account'
export * from './bank-details'
export * from './salesforce'
export * from './token'
export * from './users'
export * from './mfa'
