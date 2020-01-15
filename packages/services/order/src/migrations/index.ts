import { runOrderDataMigrations } from './migration-runner'

runOrderDataMigrations().then(() => process.exit(0))
