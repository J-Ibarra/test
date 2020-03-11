import sinon from 'sinon'
import { expect } from 'chai'
import Decimal from 'decimal.js'

import * as withdrawalServiceOperations from '@abx-service-clients/withdrawal'
import { buildWithdrawalTransactionHistory } from '../core/history'
import { CurrencyCode } from '@abx-types/reference-data'
import { TransactionType } from '@abx-types/order'
import { TransactionHistoryDirection } from '../core/history/model'
import { WithdrawalState } from '@abx-types/withdrawal'

describe('form_withdrawal_currency_transaction', () => {
  const accountId = 'foo-bar'
  const selectedCurrencyId = 1
  const selectedCurrencyCode = CurrencyCode.bitcoin
  const feeCurrencyCode = selectedCurrencyCode
  const feeCurrencyCode2 = CurrencyCode.ethereum
  const withdrawalRequest1 = {
    id: 1,
    amount: 10,
    fiatCurrencyCode: CurrencyCode.usd,
    fiatConversion: 110,
    memo: 'foo bar',
    txHash: 'txHash1',
    address: 'withdrawalTarget-1',
    createdAt: new Date().toString(),
    state: WithdrawalState.completed,
  }
  const withdrawalRequest2 = {
    id: 2,
    amount: 15,
    fiatCurrencyCode: CurrencyCode.usd,
    fiatConversion: 110,
    memo: 'foo bar 1',
    txHash: 'txHash2',
    address: 'withdrawalTarget-2',
    createdAt: new Date().toString(),
    state: WithdrawalState.pending,
  }

  beforeEach(() => sinon.restore())

  describe('buildWithdrawalTransactionHistory', () => {
    it.only('should find all withdrawal requests and the fees for each of them', async () => {
      const withdrawalRequests = [withdrawalRequest1, withdrawalRequest2]
      const withdrawalFee1 = 0.2
      const withdrawalFee2 = 0.5

      sinon.stub(withdrawalServiceOperations, 'getWithdrawalFees').resolves([
        {
          withdrawalRequestId: withdrawalRequests[0].id,
          feeCurrencyCode,
          withdrawalFee: withdrawalFee1,
        },
        {
          withdrawalRequestId: withdrawalRequests[1].id,
          feeCurrencyCode: feeCurrencyCode2,
          withdrawalFee: withdrawalFee2,
        },
      ])

      const findAllWithdrawalRequestsStub = sinon
        .stub(withdrawalServiceOperations, 'findAllWithdrawalRequestsForAccountAndCurrency')
        .resolves(withdrawalRequests)
      const transactionHistory = await buildWithdrawalTransactionHistory(accountId, selectedCurrencyId, selectedCurrencyCode)

      expect(findAllWithdrawalRequestsStub.calledWith(accountId, selectedCurrencyId)).to.eql(true)
      expect(transactionHistory.length).to.eql(2)
      expect(transactionHistory[0]).to.eql({
        transactionType: TransactionType.transfer,
        primaryCurrencyCode: selectedCurrencyCode,
        primaryAmount: new Decimal(withdrawalRequest1.amount)
          .plus(withdrawalFee1)
          .mul(-1)
          .toNumber(),
        isFee: false,
        preferredCurrencyCode: withdrawalRequest1.fiatCurrencyCode.toString() as CurrencyCode,
        preferredCurrencyAmount: -withdrawalRequest1.fiatConversion,
        title: `${withdrawalRequest1.address.substring(0, 7)}...${withdrawalRequest1.address.substring(withdrawalRequest1.address.length - 4)}`,
        memo: withdrawalRequest1.memo,
        direction: TransactionHistoryDirection.outgoing,
        createdAt: withdrawalRequest1.createdAt,
        transactionId: withdrawalRequest1.txHash,
        targetAddress: withdrawalRequest1.address,
        fee: withdrawalFee1,
        feeCurrency: feeCurrencyCode,
        metadata: {
          status: withdrawalRequest1.state,
        },
      })
      expect(transactionHistory[1]).to.eql({
        transactionType: TransactionType.transfer,
        primaryCurrencyCode: selectedCurrencyCode,
        primaryAmount: new Decimal(withdrawalRequest2.amount).mul(-1).toNumber(),
        isFee: false,
        preferredCurrencyCode: withdrawalRequest2.fiatCurrencyCode.toString() as CurrencyCode,
        preferredCurrencyAmount: -withdrawalRequest2.fiatConversion,
        title: `${withdrawalRequest2.address.substring(0, 7)}...${withdrawalRequest2.address.substring(withdrawalRequest2.address.length - 4)}`,
        memo: withdrawalRequest2.memo!,
        direction: TransactionHistoryDirection.outgoing,
        createdAt: withdrawalRequest2.createdAt,
        transactionId: withdrawalRequest2.txHash,
        targetAddress: withdrawalRequest2.address,
        fee: withdrawalFee2,
        feeCurrency: feeCurrencyCode2,
        metadata: {
          status: withdrawalRequest2.state,
        },
      })
    })
  })
})
