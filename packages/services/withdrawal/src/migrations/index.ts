import { runWithdrawalDataMigrations } from './migration-runner'

runWithdrawalDataMigrations().then(() => process.exit(0))
