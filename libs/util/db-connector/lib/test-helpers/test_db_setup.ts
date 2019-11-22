import { runMigrations } from '../sequelize-setup/migration'

runMigrations()
  .then(() => console.log('Job Done'))
  .then(() => process.exit(0))
