// import { runMigrations } from '@abx/db-connection-utils'
import { runLegacyMigrations } from '@abx/kbe-legacy-migrations'

export function runReferenceDataMigrations() {
  return (
    runLegacyMigrations()
      // .then(() => runMigrations(`${__dirname}/templates`))
      .then(() => console.log('Reference data migrations successfully executed'))
  )
}
