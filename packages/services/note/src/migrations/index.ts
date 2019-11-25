import { runNoteMigrations } from './migration-runner'

runNoteMigrations().then(() => process.exit(0))
