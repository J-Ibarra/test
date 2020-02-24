import { runMigrations } from '@abx-utils/db-connection-utils'
import { runLegacyMigrations } from '@abx-utils/kbe-legacy-migrations'

export function runDepositDataMigrations() {
  return runLegacyMigrations()
    .then(() => runMigrations(`${__dirname}/templates`))
    .then(() => console.log('Reference data migrations successfully executed'))
}
