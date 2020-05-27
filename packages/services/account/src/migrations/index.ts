import { runAccountDataMigrations } from './migration-runner'

runAccountDataMigrations().then(() => process.exit(0))
