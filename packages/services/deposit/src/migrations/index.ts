import { runDepositDataMigrations } from './migration-runner'

runDepositDataMigrations().then(() => process.exit(0))
