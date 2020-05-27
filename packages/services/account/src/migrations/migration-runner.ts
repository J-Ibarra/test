import { runMigrations } from '@abx-utils/db-connection-utils'

export function runAccountDataMigrations() {
  return runMigrations(`${__dirname}/templates`).then(() => console.log('Account Data migrations successfully executed'))
}
