import '@abx/note-query-lib'
import { runMigrations } from '@abx/db-connection-utils'

runMigrations().then(() => console.log('Note migrations successfully executed'))
