import { runMigrations } from '@abx-utils/db-connection-utils'

export function runDepositDataMigrations() {
  return runMigrations(`${__dirname}/templates`).then(() => console.log('Reference data migrations successfully executed'))
}
