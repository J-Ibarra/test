import { runMigrations } from '@abx-utils/db-connection-utils'

export function runWithdrawalDataMigrations() {
  return runMigrations(`${__dirname}/templates`).then(() => console.log('Deposit Data migrations successfully executed'))
}
