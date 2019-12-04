import { getModel } from '@abx/db-connection-utils'
import { Session } from '../../../model/account/src/user/Session.interface'
import { Transaction } from 'sequelize'

export async function findSession(id: string, transaction?: Transaction): Promise<Session> {
  const session = await getModel<Session>('session').findByPrimary(id, { transaction })

  return session ? session.get() : null
}
