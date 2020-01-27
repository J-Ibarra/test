import { Transaction } from 'sequelize'
import { sequelize } from '@abx-utils/db-connection-utils'

export async function getTradeTransactionIdPair(t?: Transaction) {
  const sequelizeReturn = await Promise.all([
    sequelize.query(`select nextval('abx_transactions_id_seq')`, { transaction: t }),
    sequelize.query(`select nextval('abx_transactions_id_seq')`, { transaction: t }),
  ])

  const sequenceValues = [parseInt(sequelizeReturn[0][0][0].nextval, 10), parseInt(sequelizeReturn[1][0][0].nextval, 10)]

  return sequenceValues
}
