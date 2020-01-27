import { runMigrations } from '@abx-utils/db-connection-utils'

export function runLegacyMigrations() {
  return runMigrations(`${__dirname}/legacy-migrations`).then(() => console.log('Legacy migrations successfully executed'))
}
