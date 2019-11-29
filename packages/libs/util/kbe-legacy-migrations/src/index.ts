import { runMigrations } from '@abx/db-connection-utils'

export function runLegacyMigrations() {
  return runMigrations(`${__dirname}/legacy-migrations`).then(() => console.log('Note migrations successfully executed'))
}
