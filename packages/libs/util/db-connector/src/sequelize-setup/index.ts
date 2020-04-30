import Sequelize from 'sequelize'

import { getEnvironmentConfig } from '../env-config'
import { migrationModel } from './migration'

const dbConfig = getEnvironmentConfig().exchangeDb

// Instantiate sequelize connection to the correct database
export const sequelize = dbConfig.readReplica
  ? new Sequelize({
      dialect: dbConfig.dialect,
      pool: dbConfig.pool,
      logging: false,
      replication: {
        write: {
          host: dbConfig.host,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.schema,
          port: dbConfig.port,
        },
        read: [
          {
            host: dbConfig.readReplica!.host,
            username: dbConfig.readReplica!.username,
            password: dbConfig.readReplica!.password,
            port: dbConfig.readReplica!.port,
            database: dbConfig.readReplica!.database,
          },
        ],
      },
      define: {
        freezeTableName: true,
      },
    } as any)
  : new Sequelize(dbConfig.schema, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      port: dbConfig.port,
      pool: dbConfig.pool,
      logging: false,
      define: {
        freezeTableName: true,
      },
    })

sequelize.authenticate().catch((err) => {
  console.error('Unable to connect to the database:', err)
})

migrationModel(sequelize)

export const exitOnLostConnection = (sequelizeInstance: Sequelize.Sequelize): void => {
  setInterval(() => {
    sequelizeInstance.query('select 1;').catch((error: Error) => {
      console.error('DB Connection issue detected.')
      console.error('error:', error)
      console.error('sequelizeInstance:', sequelizeInstance)
      console.error('Calling `process.exit()`.')
      process.exit()
    })
  }, 30 * 1000)
}

exitOnLostConnection(sequelize)

if (process.env.SYNCDB) {
  sequelize.sync().catch((error) => {
    console.error(JSON.stringify(error, null, 2))
    throw error
  })
}

export * from './transaction_wrapper'
export * from './migration'

export function setupModel(modelSetupFn: (sequelizeClient: Sequelize.Sequelize) => void) {
  modelSetupFn(sequelize)
}

export function getModel<T>(modelName) {
  return sequelize.model<Sequelize.Instance<T>, T>(modelName)
}
