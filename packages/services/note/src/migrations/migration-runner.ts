import '@abx/note-query-lib'
import { runMigrations } from '@abx/db-connection-utils'

export function runNoteMigrations() {
  return runMigrations(`${__dirname}/templates`).then(() => console.log('Note migrations successfully executed'))
}
