import Sequelize from 'sequelize'

import environmentConfig from '../env-config'

const dbConfig = environmentConfig.exchangeDb

// Instantiate sequelize connection to the correct database
const sequelize = new Sequelize(dbConfig.schema, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  pool: dbConfig.pool,
  logging: false,
  define: {
    freezeTableName: true,
  },
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

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
  sequelize.sync().catch(error => {
    console.error(JSON.stringify(error, null, 2))
    throw error
  })
}

export default sequelize
export * from './transaction_wrapper'
export * from './migration'

export function setupModel(modelSetupFn: (sequelizeClient: Sequelize.Sequelize) => void) {
  modelSetupFn(sequelize)
}

export function getModel<T>(modelName: string) {
  return sequelize.model<Sequelize.Instance<T>, T>(modelName)
}
