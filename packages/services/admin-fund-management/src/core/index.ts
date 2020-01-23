import { setupModel } from '@abx-utils/db-connection-utils'

import setAdminRequestModel from './models'

setupModel(setAdminRequestModel)

export * from './account_summary_creator'
export * from './admin-requests'
