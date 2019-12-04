import { runReferenceDataMigrations } from './migration-runner'

runReferenceDataMigrations().then(() => process.exit(0))
