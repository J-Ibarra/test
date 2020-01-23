import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'

export const currencyToWithdrawalRequestsKey = 'currencyToWithdrawalRequests'

export const withdrawalRequest: WithdrawalRequest = {
  id: 1,
  amount: 12,
  state: WithdrawalState.pending,
  currencyId: 1,
  feeCurrencyId: 1,
  accountId: '1',
  fiatCurrencyCode: FiatCurrency.usd,
  fiatConversion: 1,
  kauConversion: 10,
  type: WithdrawalRequestType.withdrawal,
  kinesisCoveredOnChainFee: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const cryptoWithdrawalRequest = {
  ...withdrawalRequest,
  currency: { id: 2, code: CurrencyCode.kag, sortPriority: 3, orderPriority: 2 },
  feeCurrency: { id: 2, code: CurrencyCode.kag, sortPriority: 3, orderPriority: 2 },
}
