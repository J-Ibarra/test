import { runAdminFundDataMigrations } from './migration-runner'

runAdminFundDataMigrations().then(() => process.exit(0))
