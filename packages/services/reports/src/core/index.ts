import { setupModel } from '@abx/db-connection-utils'

import setupReportDataModel from './model'

setupModel(setupReportDataModel)

export * from './generate_report'
export * from './get_report_from_aws'
export * from './stored_reports/store_reports'
