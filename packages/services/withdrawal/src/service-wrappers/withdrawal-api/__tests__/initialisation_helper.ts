import { WithdrawalRequest } from '@abx-types/withdrawal'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { CurrencyCode } from '@abx-types/reference-data'

export const createAccountsAndWithdrawalFunctions = async () => {
  const usdCurrency = { code: CurrencyCode.usd, id: 5 }
  const kauCurrency = { code: CurrencyCode.kau, id: 2 }
  const ethCurrency = { code: CurrencyCode.ethereum, id: 3 }

  const tempAccountGiver = await createTemporaryTestingAccount()

  const tempAccountReceiver = await createTemporaryTestingAccount()

  const usdBalance = {
    id: 1,
    value: 10000,
    currencyId: usdCurrency.id,
  }
  const kauBalance = {
    id: 2,
    value: 10000,
    currencyId: kauCurrency.id,
  }
  const ethBalance = {
    id: 3,
    available: { value: 10000 },
    currencyId: ethCurrency.id,
  }

  const usdWithdrawalGenerator = createWithdrawalParams({
    accountId: tempAccountGiver.id,
  })

  return {
    accountOne: tempAccountGiver,
    accountTwo: tempAccountReceiver,
    usdCurrency,
    kauCurrency,
    ethCurrency,
    // kauWithdrawalGenerator,
    usdWithdrawalGenerator,
    usdBalance,
    kauBalance,
    ethBalance,
  }
}

export const createWithdrawalParams = ({ address, accountId, txHash }: Pick<WithdrawalRequest, 'address' | 'accountId' | 'txHash'>) => ({
  amount,
  state,
  currencyId,
  kauConversion,
  fiatConversion,
  fiatCurrencyCode,
}: Pick<WithdrawalRequest, 'amount' | 'state' | 'currencyId' | 'kauConversion' | 'fiatConversion' | 'fiatCurrencyCode'>) => {
  return {
    address,
    amount,
    state,
    accountId,
    currencyId,
    txHash,
    kauConversion,
    fiatConversion,
    fiatCurrencyCode,
  }
}

export const sortById = (idPrev: WithdrawalRequest, idNext: WithdrawalRequest) => idPrev.id! - idNext.id!
