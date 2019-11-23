import '@abx/note-query-lib'
import { runMigrations } from '@abx/db-connection-utils'

runMigrations(`${__dirname}/templates`)
  .then(() => console.log('Note migrations successfully executed'))
  .then(() => process.exit(0))
