import { runMigrations } from '@abx-utils/db-connection-utils'

export function runAdminFundDataMigrations() {
  return runMigrations(`${__dirname}/templates`).then(() => console.log('Admin Fund Data migrations successfully executed'))
}
