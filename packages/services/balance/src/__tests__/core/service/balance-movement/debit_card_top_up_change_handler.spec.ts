import { expect } from 'chai'

import { AccountType } from '@abx-types/account'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { BalanceType, SourceEventType } from '@abx-types/balance'
import { DebitCardTopUpChangeHandler, BalanceRepository } from '../../../../core'

const balanceRepository = BalanceRepository.getInstance()
const debitCardTopUpChangeHandler = new DebitCardTopUpChangeHandler()

describe('debit_card_top_up_change_handler', () => {
  let testAccount
  const availableBalance = 100
  const currencyId = 1
  beforeEach(async () => {
    testAccount = await createTemporaryTestingAccount(AccountType.individual)
    await balanceRepository.updateOrCreateBalance(testAccount.id, currencyId, availableBalance, BalanceType.available)
  })

  it('createPendingDebitCardTopUp should only proceed when balance is not locked', async () => {
    await Promise.all([
      lockAndUpdateBalance(testAccount.id, 1),
      new Promise(async resolve => {
        return wrapInTransaction(sequelize, null, async transaction => {
          try {
            await debitCardTopUpChangeHandler.createPendingDebitCardTopUp({
              sourceEventType: SourceEventType.debitCardTopUp,
              sourceEventId: 1,
              currencyId,
              accountId: testAccount.id,
              amount: 30,
              t: transaction,
            })
          } catch (e) {
            expect(e.message).to.eql('Available balance is less than debit card top up amount')
          }

          resolve()
        })
      }),
    ])
  }).timeout(60_000)
})

const lockAndUpdateBalance = async (accountId: string, currencyId: number) => {
  return wrapInTransaction(sequelize, null, async transaction => {
    await balanceRepository.lockBalancesForAccounts({ accountIds: [accountId], currencyIds: [1], transaction })

    await new Promise(res => setTimeout(() => res(), 2000))

    await balanceRepository.updateOrCreateBalance(accountId, currencyId, -90, BalanceType.available, transaction)
  })
}
