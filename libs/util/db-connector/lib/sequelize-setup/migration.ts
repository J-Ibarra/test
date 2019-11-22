import Umzug from 'umzug'
import Sequelize from 'sequelize'
import * as _ from 'lodash'
import Warlock from 'node-redis-warlock'
import { getVanillaRedisClient } from '../cache/redis'
import sequelizeInstance from './index'

const warlock = new Warlock(getVanillaRedisClient())

export async function runMigrations() {
  console.log('Attempting to acquire lock to run migrations')
  return acquire_migration_lock(async () => {
    // use async for that sweet error handling
    console.log('Lock acquired, running migrations')
    const umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeInstance,
        model: sequelizeInstance.models.sequelizeMeta,
      },
      logging: running => console.log(running),
      migrations: {
        params: [sequelizeInstance.getQueryInterface(), Sequelize],
        pattern: /\.js$/,
        path: `${__dirname}/migrations/templates`,
      },
    })

    return umzug.up().then(() => {
      console.log('Migrations complete')
    })
  })
}

const migrationLock = 'migration-lock'
// The lock has a maximum of 10 minutes to live. This will give us enough time to stop services if a migration falls over
// The reason why we don't have this as a short period of time is that it would be very unfortunate if a migration fails half way
// and then runs again when the ttl expires (thus running part of the migration twice)
const ttl = 600_000
function acquire_migration_lock(handleUnlocked: () => Promise<void>) {
  return new Promise((res, rej) => {
    warlock.lock(migrationLock, ttl, (err, unlock): any => {
      if (err) {
        rej('Failed to acquire lock needed to run migrations.' + err.message)
      } else if (_.isFunction(unlock)) {
        // If a function is provided, we have acquired the lock
        return handleUnlocked().then(
          () => {
            unlock()
            return res()
          },
          error => {
            rej('Failed to run migrations.' + error.message)
          },
        )
      } else {
        // unable to establish lock because it is already locked try again in a second
        setTimeout(() => {
          acquire_migration_lock(handleUnlocked).then(res, rej)
        }, 1000)
      }
    })
  })
}

export function migrationModel(sequelize) {
  const options = {
    tableName: 'sequelize_meta',
    timestamps: false,
  }

  return sequelize.define(
    'sequelizeMeta',
    {
      name: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
    },
    options,
  )
}
