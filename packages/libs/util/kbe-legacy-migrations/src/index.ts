import { runMigrations } from '@abx/db-connection-utils'

export function runLegacyMigrations() {
  return runMigrations(`${__dirname}/legacy-migrations`).then(() => console.log('Legacy migrations successfully executed'))
}
