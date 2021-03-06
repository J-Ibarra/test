import { expect } from 'chai'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { SourceEventType } from '@abx-types/balance'
import { BalanceAdjustmentRepository } from '../..'
import { createAvailableBalance } from '../test_utils'

const currencyId = 1

describe.skip('BalanceAdjustmentRepository', () => {
  const balanceAdjustmentRepository = BalanceAdjustmentRepository.getInstance()

  it('createAdjustment should create an adjustment', async () => {
    const { id: accountId } = await createTemporaryTestingAccount()

    const balance = await createAvailableBalance(accountId, 100, currencyId)
    const adjustmentBalance = 50
    const adjustmentDelta = 30
    await balanceAdjustmentRepository.createAdjustment(balance.id!, adjustmentBalance, adjustmentDelta, SourceEventType.orderMatch, 1)

    const balanceAdjustment = await balanceAdjustmentRepository.getBalanceAdjustmentsForBalance(balance.id!)
    expect(balanceAdjustment[0].value).to.eql(adjustmentBalance)
    expect(balanceAdjustment[0].delta).to.eql(adjustmentDelta)
  })
})
