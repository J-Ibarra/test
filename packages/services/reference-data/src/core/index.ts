import { setupModel } from '@abx/db-connection-utils'

import setupModelReferenceDataModel from './model'

setupModel(setupModelReferenceDataModel)

export * from './symbols'
