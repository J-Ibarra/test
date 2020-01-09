import { Transaction } from 'sequelize'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { AdminRequest } from './model'

import { AdminFundManagementEndpoints } from './endpoints'


export async function findAdminRequest(queryParams: Partial<AdminRequest>,transaction?: Transaction,): Promise<AdminRequest> {

    const epicurus = getEpicurusInstance()
    return epicurus.request(AdminFundManagementEndpoints.findAdminRequest, { queryParams, transaction })
}


export async function saveClientTriggeredFiatWithdrawalAdminRequest(
  accountId: string,
  currencyCode: CurrencyCode,
  amount: number,
  memo: string,
  transaction: Transaction,
): Promise<AdminRequest> {

    const epicurus = getEpicurusInstance()
    return epicurus.request(AdminFundManagementEndpoints.saveClientTriggeredFiatWithdrawalAdminRequest, { accountId, currencyCode, amount, memo, transaction })

}

export async function updateAdminRequest(id: number, update: Partial<AdminRequest>, transaction?: Transaction,): Promise<AdminRequest> {
    
    const epicurus = getEpicurusInstance()
    return epicurus.request(AdminFundManagementEndpoints.updateAdminRequest, { id, update, transaction })
}



export * from './endpoints'
