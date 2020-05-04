import { findDepositAddressesForPublicKeysAndCurrency, FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION } from '../../../core'
import { findAccountsByIdWithUserDetails } from '@abx-service-clients/account'
import { DepositAddress } from '@abx-types/deposit'
import { AccountStatus } from '@abx-types/account'
import { DepositTransaction } from '@abx-utils/blockchain-currency-gateway'
import { findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import { calculateRealTimeMidPriceForSymbol, calculateRealTimeMidPriceForSymbols } from '@abx-service-clients/market-data'

export interface DepositAddressAccountStatusPair {
  depositAddress: DepositAddress
  accountStatus: AccountStatus
}

export async function createPublicKeyToDepositorDetailsMap(latestDepositOperations: DepositTransaction[], currencyId: number) {
  const depositAddresses = await findDepositAddressesForPublicKeysAndCurrency(latestDepositOperations.map(({ to }) => to!), currencyId)
  const accountDetailsForDepositAddresses = await findAccountsByIdWithUserDetails(depositAddresses.map(({ accountId }) => accountId))
  const accountIdToAccountStatus = accountDetailsForDepositAddresses.reduce((acc, { id, status }) => ({ ...acc, [id]: status }), {})

  return depositAddresses.reduce(
    (acc, depositAddress) => acc.set(depositAddress.publicKey, { depositAddress, accountStatus: accountIdToAccountStatus[depositAddress.accountId] }),
    new Map<string, DepositAddressAccountStatusPair>(),
  )
}

let latestFiatPriceForOneCrypto = new Map<CurrencyCode, number>()

export async function getBoundaryAndLatestFiatValuePair(
  currencyCode: CurrencyCode,
): Promise<{ fiatValueOfOneCryptoCurrency: number; currencyBoundary: CurrencyBoundary }> {
  const currencyBoundary = await findBoundaryForCurrency(currencyCode)
  let fiatValueOfOneCryptoCurrency = latestFiatPriceForOneCrypto.get(currencyCode)

  if (!fiatValueOfOneCryptoCurrency) {
    fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currencyCode}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)
    latestFiatPriceForOneCrypto.set(currencyCode, fiatValueOfOneCryptoCurrency)
  }

  return {
    fiatValueOfOneCryptoCurrency,
    currencyBoundary,
  }
}

/** Refreshing the mid prices every minute. */
setInterval(async () => {
  const symbolToMidPrice = await calculateRealTimeMidPriceForSymbols([
    `${CurrencyCode.kag}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`,
    `${CurrencyCode.kau}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`,
  ])

  latestFiatPriceForOneCrypto.set(CurrencyCode.kag, symbolToMidPrice.get(CurrencyCode.kag)!)
  latestFiatPriceForOneCrypto.set(CurrencyCode.kau, symbolToMidPrice.get(CurrencyCode.kau)!)
}, 60_000)
