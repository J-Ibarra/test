import Decimal from 'decimal.js'
import { findAdminRequest } from '@abx-service-clients/admin-fund-management'
import { findBoundaryForCurrency, truncateCurrencyValue, truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { KINESIS_BASE_NETWORK_FEE, KINESIS_ON_CHAIN_TRANSACTION_FEE, CurrencyCode } from '@abx-types/reference-data'
import { getWithdrawalConfigForCurrency } from '@abx-service-clients/reference-data'
import { SupportedFxPair } from '@abx-types/order'
import { getQuoteFor, convertAndTruncateCurrencyValue } from '@abx-utils/fx-rate'

/**
 * Convert the amount to equivalent KAU value
 * @param currencyCode
 * @param amount
 */
export async function kauConversion(currencyCode: CurrencyCode, amount: number): Promise<string> {
  if (currencyCode === CurrencyCode.kau) {
    return truncateCurrencyValue({ currencyCode, value: amount })
  }

  if (currencyCode === CurrencyCode.euro) {
    const usdForOneEur = await getQuoteFor(SupportedFxPair.EUR_USD)
    const amountInUsd = new Decimal(amount).times(usdForOneEur)
    return convertAndTruncateCurrencyValue(amountInUsd, CurrencyCode.usd, CurrencyCode.kau)
  } else {
    return convertAndTruncateCurrencyValue(new Decimal(amount), currencyCode, CurrencyCode.kau)
  }
}

/**
 * Calculate the total amount of the provide currency
 * @param amount
 * @param currencyCode
 */
export async function getTotalWithdrawalAmount(amount: number, currencyCode: CurrencyCode, fee?: number): Promise<number> {
  if (typeof fee !== 'undefined') {
    return new Decimal(amount).add(fee).toNumber()
  }

  const { withdrawalFee } = await getWithdrawalFee(currencyCode, amount)
  return new Decimal(amount).add(withdrawalFee).toNumber()
}

const isKauKag = currencyCode => [CurrencyCode.kau, CurrencyCode.kag].includes(currencyCode)
const isEcr20Token = currencyCode => [CurrencyCode.kvt, CurrencyCode.tether].includes(currencyCode)

export async function getWithdrawalFee(
  currencyCode: CurrencyCode,
  withdrawalAmount: number,
  adminRequestId?: number,
): Promise<{ withdrawalFee: number; feeCurrencyCode: CurrencyCode }> {
  if (adminRequestId) {
    const adminRequest = await findAdminRequest({ id: adminRequestId })
    if (!!adminRequest) {
      return {
        withdrawalFee: adminRequest.fee!,
        feeCurrencyCode: adminRequest.asset,
      }
    }
  }

  const feeCurrencyCode = isEcr20Token(currencyCode) ? CurrencyCode.ethereum : currencyCode
  const currencyBoundary = await findBoundaryForCurrency(feeCurrencyCode)
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary) as any

  if (isKauKag(feeCurrencyCode)) {
    return {
      withdrawalFee: truncateToCurrencyDP(
        new Decimal(withdrawalAmount)
          .times(KINESIS_ON_CHAIN_TRANSACTION_FEE)
          .add(KINESIS_BASE_NETWORK_FEE)
          .toNumber(),
      ),
      feeCurrencyCode,
    }
  }

  const { feeAmount: withdrawalFee } = await getWithdrawalConfigForCurrency({ currencyCode })

  return {
    withdrawalFee: truncateToCurrencyDP(withdrawalFee),
    feeCurrencyCode,
  }
}

async function getWithdrawalFeeForRequest(
  withdrawalRequestId: number,
  currencyCode: CurrencyCode,
  withdrawalAmount: number,
  adminRequestId?: number,
): Promise<{ withdrawalRequestId: number; withdrawalFee: number; feeCurrencyCode: CurrencyCode }> {
  const withdrawalFeeDetails = await getWithdrawalFee(currencyCode, withdrawalAmount, adminRequestId)

  return {
    withdrawalRequestId,
    ...withdrawalFeeDetails,
  }
}

export async function getWithdrawalFees(
  currencyCode: CurrencyCode,
  withdrawalParams: {
    withdrawalRequestId: number
    withdrawalAmount: number
    adminRequestId?: number
  }[],
) {
  return Promise.all(
    withdrawalParams.map(params =>
      getWithdrawalFeeForRequest(params.withdrawalRequestId, currencyCode, params.withdrawalAmount, params.adminRequestId),
    ),
  )
}
