import { get } from 'lodash'
import { isNullOrUndefined } from 'util'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { Balance } from '@abx-types/balance'
import { BalanceRetrievalHandler } from '@abx-service-clients/balance'
import { ValidationError } from '@abx-types/error'
import { BalanceSummary, FundManagementAccountSummary } from '@abx-service-clients/admin-fund-management'


const balanceRetriever = BalanceRetrievalHandler.getInstance()

export async function getAccountSummary(hin: string): Promise<FundManagementAccountSummary> {
  const account = await findAccountWithUserDetails({ hin })
  if (isNullOrUndefined(account)) {
    throw new ValidationError('Unable to find account')
  }
  const balances = await balanceRetriever.findAllBalancesForAccount(account.id)

  const userDetails = account.users[0]
  return {
    id: account.id,
    email: userDetails.email,
    hin,
    lastLogin: userDetails.lastLogin,
    createdAt: account.createdAt,
    firstName: userDetails.firstName,
    lastName: userDetails.lastName,
    status: account.status,
    suspended: account.suspended,
    balances: transformToBalanceSummaries(balances),
  }
}

function transformToBalanceSummaries(balances: Balance[]): BalanceSummary[] {
  return balances.map(balance => ({
    currency: balance.currency,
    available: get(balance, 'available.value', 0),
    reserved: get(balance, 'reserved.value', 0),
    pendingDeposit: get(balance, 'pendingDeposit.value', 0),
    pendingWithdrawal: get(balance, 'pendingWithdrawal.value', 0),
  }))
}
