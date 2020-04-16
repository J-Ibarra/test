import sinon from 'sinon'
import { expect } from 'chai'
import * as accountServiceClientOperations from '@abx-service-clients/account'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as balanceOperations from '@abx-service-clients/balance'

import { CurrencyCode } from '@abx-types/reference-data'
import { deductOnChainTransactionFeeFromRevenueBalance } from '../../core/withdrawal-transaction-sent-recorder/kinesis_revenie_transaction_fee_reconciler'
import { SourceEventType } from '@abx-types/balance'

describe('deductOnChainTransactionFeeFromRevenueBalance', () => {
  let findOrCreateKinesisRevenueAccountStub
  let updateAvailableStub
  let denyPendingDepositStub

  const currency = {
    id: 1,
    code: CurrencyCode.ethereum,
  }
  const withdrawalRequestId = 1
  const transactionFee = 0.3
  const kinesisRevenueAccount = 'foo'

  beforeEach(() => {
    sinon.restore()
    findOrCreateKinesisRevenueAccountStub = sinon
      .stub(accountServiceClientOperations, 'findOrCreateKinesisRevenueAccount')
      .resolves({ id: kinesisRevenueAccount })
    updateAvailableStub = sinon.stub(balanceOperations, 'updateAvailable').resolves()
    denyPendingDepositStub = sinon.stub(balanceOperations, 'denyPendingDeposit').resolves()
  })

  afterEach(() => sinon.restore())

  it('should not execute any logic when on chain fee not covered for currency', async () => {
    await deductOnChainTransactionFeeFromRevenueBalance(
      withdrawalRequestId,
      transactionFee,
      {
        ticker: CurrencyCode.kau,
      } as any,
      {
        id: currency.id,
        code: CurrencyCode.kau,
      },
    )

    expect(findOrCreateKinesisRevenueAccountStub.calledOnce).to.eql(false)
  })

  it('should invoke updateAvailable when transaction fee currency not the same as user charged fee currency', async () => {
    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves(currency)

    await deductOnChainTransactionFeeFromRevenueBalance(
      withdrawalRequestId,
      transactionFee,
      {
        ticker: CurrencyCode.ethereum,
      } as any,
      {
        id: 2,
        code: CurrencyCode.tether,
      },
    )

    expect(findOrCreateKinesisRevenueAccountStub.calledOnce).to.eql(true)
    expect(
      updateAvailableStub.calledWith({
        accountId: kinesisRevenueAccount,
        amount: -transactionFee,
        currencyId: currency.id,
        sourceEventId: withdrawalRequestId!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      }),
    ).to.eql(true)
  })

  it('should invoke denyPendingDeposit when transaction fee currency is the same as user charged fee currency', async () => {
    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves(currency)

    await deductOnChainTransactionFeeFromRevenueBalance(
      withdrawalRequestId,
      transactionFee,
      {
        ticker: CurrencyCode.ethereum,
      } as any,
      currency,
    )

    expect(findOrCreateKinesisRevenueAccountStub.calledOnce).to.eql(true)
    expect(
      denyPendingDepositStub.calledWith({
        accountId: kinesisRevenueAccount,
        amount: transactionFee,
        currencyId: currency.id,
        sourceEventId: withdrawalRequestId!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      }),
    ).to.eql(true)
  })
})
