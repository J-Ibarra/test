import { Transaction } from 'sequelize'
import { sequelize } from '@abx/db-connection-utils'
import { AdminRequestType } from '@abx-service-clients/admin-fund-management'

export enum GTIDInitials {
  withdrawal = 'WT',
  deposit = 'DT',
  redemption = 'RT',
  order = 'OT',
}

export async function getNextGlobalTransactionId(type: AdminRequestType, transaction: Transaction) {
  const [[ { globalTransactionId } ]] = await sequelize.query(`
    select '${GTIDInitials[type]}' || nextval('global_transaction_id_seq') as "globalTransactionId"
  `, { raw: true, transaction })

  return globalTransactionId as string
}
