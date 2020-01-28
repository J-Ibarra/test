import { getModel } from '@abx-utils/db-connection-utils'
import { Session } from '@abx-types/account/src/user/Session.interface'
import { Transaction } from 'sequelize'

export async function findSession(id: string, transaction?: Transaction): Promise<Session | null> {
  const session = await getModel<Session>('session').findByPrimary(id, { transaction })

  return session ? session.get() : null
}
