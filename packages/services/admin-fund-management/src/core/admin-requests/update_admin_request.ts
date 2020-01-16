import { Transaction } from 'sequelize'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { AdminRequestStatus } from '@abx-service-clients/admin-fund-management'
import { updateAdminRequest } from './requests_repository'

export async function updateAdminRequestStatus(id: number, adminId: string, status: AdminRequestStatus, transaction?: Transaction) {
  return wrapInTransaction(sequelize, transaction, async t => {
    const adminAccount = await findAccountWithUserDetails({ id: adminId })
    const adminUserDetails = adminAccount!.users![0]

    return updateAdminRequest(
      id,
      {
        admin: `${adminUserDetails.firstName} ${adminUserDetails.lastName}`,
        status,
      },
      t,
    )
  })
}
