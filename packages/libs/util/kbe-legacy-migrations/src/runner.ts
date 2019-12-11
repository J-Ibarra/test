import { runLegacyMigrations } from './index'

runLegacyMigrations().then(() => process.exit(0))
