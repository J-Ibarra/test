import { buildDepositTransactionHistory } from '../core/history'
import { CurrencyCode } from '@abx-types/reference-data'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as depositServiceOperations from '@abx-service-clients/deposit'
import * as withdrawalServiceOperations from '@abx-service-clients/withdrawal'

import sinon from 'sinon'
import { expect } from 'chai'
import { TransactionType } from '@abx-types/order'
import { TransactionHistoryDirection } from '../core/history/model'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('form_deposit_currency_transaction', () => {
  const accountId = 'acc-id'
  const senderAccountId = 'acc-id-2'
  const selectedCurrencyCode = CurrencyCode.bitcoin
  const publicKeyHoldings = 'pk-holdings'
  const currencies = [
    {
      id: 1,
      code: CurrencyCode.bitcoin,
    },
  ]
  const depositRequest1 = {
    id: 1,
    depositTxHash: 'depositThHash',
    amount: 9,
    fiatCurrencyCode: CurrencyCode.usd,
    fiatConversion: 112,
    from: 'foobar-xaxgxas12314fc-bfvfdaeaqwe-123fsd',
    createdAt: new Date().toString(),
    status: DepositRequestStatus.pendingHoldingsTransaction,
  }
  const depositRequest2 = {
    id: 2,
    depositTxHash: 'depositThHash-2',
    amount: 12,
    fiatCurrencyCode: CurrencyCode.usd,
    fiatConversion: 132,
    from: publicKeyHoldings,
    createdAt: new Date().toString(),
    status: DepositRequestStatus.completed,
  }

  describe('buildDepositTransactionHistory', () => {
    it('should include all crypto deposit requests', async () => {
      const depositRequests = [depositRequest1, depositRequest2]
      const depositTransactions = [
        {
          requestId: depositRequest2.id,
          amount: 12,
          createdAt: depositRequest2.createdAt,
        },
      ] as any
      const senderMemo = 'memo-foo'
      const senderAddress = 'sender-address-xsfdsg13123f-address'

      sinon.stub(referenceDataOperations, 'getExchangeHoldingsWallets').resolves([
        {
          currency: CurrencyCode.bitcoin,
          publicKey: publicKeyHoldings,
        },
      ])
      sinon.stub(withdrawalServiceOperations, 'findWithdrawalRequestsForTransactionHashes').resolves([
        {
          txHash: depositRequest2.depositTxHash,
          memo: senderMemo,
          accountId: senderAccountId,
        },
      ])
      sinon.stub(depositServiceOperations, 'findDepositAddressesForAccount').resolves([
        {
          currencyId: currencies[0].id,
          publicKey: senderAddress,
        },
      ])

      sinon.stub(depositServiceOperations, 'findDepositRequestsForAccountAndCurrency').resolves(depositRequests)
      const transactionHistory = await buildDepositTransactionHistory(accountId, selectedCurrencyCode, depositTransactions, currencies)

      expect(transactionHistory[0]).to.eql({
        transactionType: TransactionType.currency,
        primaryCurrencyCode: selectedCurrencyCode,
        primaryAmount: depositRequest1.amount,
        preferredCurrencyCode: depositRequest1.fiatCurrencyCode.toString() as CurrencyCode,
        preferredCurrencyAmount: depositRequest1.fiatConversion,
        title: `${depositRequest1.from.substring(0, 7)}...${depositRequest1.from.substring(depositRequest1.from.length - 4)}`,
        memo: '',
        direction: TransactionHistoryDirection.incoming,
        createdAt: depositRequest1.createdAt!,
        transactionId: depositRequest1.depositTxHash,
        targetAddress: depositRequest1.from,
        metadata: {
          status: depositRequest1.status,
        },
      })

      expect(transactionHistory[1]).to.eql({
        transactionType: TransactionType.transfer,
        primaryCurrencyCode: selectedCurrencyCode,
        primaryAmount: depositRequest2.amount,
        preferredCurrencyCode: depositRequest2.fiatCurrencyCode.toString() as CurrencyCode,
        preferredCurrencyAmount: depositRequest2.fiatConversion,
        title: `${senderAddress.substring(0, 7)}...${senderAddress.substring(senderAddress.length - 4)}`,
        memo: senderMemo,
        direction: TransactionHistoryDirection.incoming,
        createdAt: depositRequest2.createdAt!,
        transactionId: depositRequest2.depositTxHash,
        targetAddress: senderAddress,
        metadata: {
          status: depositRequest2.status,
        },
      })
    })
  })
})
