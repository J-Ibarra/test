import { expect } from 'chai'
import sinon from 'sinon'
import { withdrawFundsFromHoldingsAccountToTargetAddress } from '../../../framework'
import { withdrawalRequest } from '../test-utils'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

const testTxHash = '1231312312312'
const testTransactionFee = '123'

describe('crypto_funds_transferrer', () => {
  afterEach(() => sinon.restore())

  it('should throw error if holdings balance not enough', async () => {
    const transferFromExchangeHoldingsTo = sinon.mock().resolves()
    const currency = {
      getHoldingBalance: () => Promise.resolve(0),
      transferFromExchangeHoldingsTo,
    }

    try {
      await wrapInTransaction(sequelize, null, async t => {
        await withdrawFundsFromHoldingsAccountToTargetAddress(withdrawalRequest, currency as any, t)
      })
    } catch (e) {
      expect(e.message).to.eql('Withdrawal request amount is greater than holding balance for currency')
    }
  })

  it('should throw error if holdings balance not enough', async () => {
    const transferFromExchangeHoldingsTo = sinon.mock().resolves({ txHash: testTxHash, transactionFee: testTransactionFee })
    const currency = {
      getHoldingBalance: () => Promise.resolve(1000),
      transferFromExchangeHoldingsTo,
    }

    const { txHash, transactionFee } = await wrapInTransaction(sequelize, null, async t =>
      withdrawFundsFromHoldingsAccountToTargetAddress(withdrawalRequest, currency as any, t),
    )

    expect(txHash).to.eql(testTxHash)
    expect(transactionFee).to.eql(+testTransactionFee)
  })
})
