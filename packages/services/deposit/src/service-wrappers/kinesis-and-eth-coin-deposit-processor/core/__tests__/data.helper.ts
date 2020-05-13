import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { BalanceAdjustment, RawBalance, SourceEventType } from '@abx-types/balance'

export const currencyToDepositRequests = 'currencyToDepositRequests'
export const decryptedPrivateKey = 'decrypted encryptedPrivateKey'
export const depositAddress: DepositAddress = {
  id: 1,
  accountId: 'dab0a9f7-b4ef-4061-8dd2-423c3e3392f9',
  currencyId: 1,
  encryptedPrivateKey: 'encryptedPrivateKey',
  publicKey: 'publicKey',
  transactionTrackingActivated: false,
}

export const depositRequest: DepositRequest = {
  id: 1,
  depositAddress,
  amount: 10,
  depositTxHash: 'deposit-tx-hash',
  from: 'foo-address',
  status: DepositRequestStatus.pendingHoldingsTransaction,
  fiatConversion: 2,
  fiatCurrencyCode: FiatCurrency.usd,
}


export const balanceAdjustment: BalanceAdjustment = {
  id: 1,
  balance: {} as RawBalance,
  balanceId: 2,
  sourceEventType: SourceEventType.currencyDeposit,
  sourceEventId: 1,
  value: 10,
  delta: 0.3,
  createdAt: new Date()
}

export const testAccount = {
  hin: 'test-hin',
}

export const testUser = {
  email: 'test@abx.com',
}

export const testBoundary = {
  id: 1,
  minAmount: 0.02,
  maxDecimals: 5,
  currencyCode: CurrencyCode.kau,
}
