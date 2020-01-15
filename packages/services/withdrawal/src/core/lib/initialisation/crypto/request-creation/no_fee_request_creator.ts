import { Transaction } from 'sequelize'
import { calculateConversionRates } from '.'
import { FiatCurrency } from '@abx-types/reference-data'
import { InitialiseWithdrawalParams, WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import { createWithdrawalRequest } from '../../../common/create_withdrawal_request'

export async function createSingleWithdrawalRequest(
  initialiseWithdrawalParams: InitialiseWithdrawalParams,
  preferredCurrencyCode: FiatCurrency,
  withdrawalCurrencyId: number,
  t?: Transaction,
): Promise<WithdrawalRequest> {
  const { fiatConversion, kauConversion } = await calculateConversionRates({
    amount: initialiseWithdrawalParams.amount,
    cryptoCurrency: initialiseWithdrawalParams.currencyCode,
    preferredCurrencyCode,
  })

  return createWithdrawalRequest(
    {
      ...initialiseWithdrawalParams,
      currencyId: withdrawalCurrencyId,
      state: WithdrawalState.pending,
      fiatCurrencyCode: preferredCurrencyCode,
      fiatConversion: Number(fiatConversion),
      kauConversion: Number(kauConversion),
      type: WithdrawalRequestType.withdrawal,
    },
    t,
  )
}
