import Decimal from 'decimal.js'
import { isNullOrUndefined } from 'util'
import { findAccountById } from '@abx-service-clients/account'
import { getExcludedAccountTypesFromOrderRangeValidations, getSymbolPairSummary } from '@abx-service-clients/reference-data'
import { ValidationError } from '@abx-types/error'
import { OrderType, PlaceOrderRequest } from '@abx-types/order'
import { getLastExecutedPrice } from '../../../../core/order-match/last_executed_price_redis'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

export const validatePriceIfAccountBoundByOrderRange = async ({ accountId, symbolId, orderType, limitPrice }: PlaceOrderRequest) => {
  if (orderType === OrderType.limit) {
    const accountBoundByOrderRange = await isAccountBoundByOrderRange(accountId)

    if (accountBoundByOrderRange) {
      return validatePriceWithinOrderRange(symbolId, limitPrice!)
    }
  }
}

const validatePriceWithinOrderRange = async (symbolId: string, limitPrice: number) => {
  const lastExecutedPrice = await getLastExecutedPrice(symbolId)
  const { orderRange } = await getSymbolPairSummary(symbolId, SymbolPairStateFilter.all)

  if (lastExecutedPrice === 0 || isNullOrUndefined(orderRange)) {
    return
  }

  const { upperBounds, lowerBounds } = getOrderRangeBoundariesForSymbol(orderRange, lastExecutedPrice)

  if (limitPrice > upperBounds || limitPrice < lowerBounds) {
    throw new ValidationError('Order request cannot be placed as it falls outside of the order range')
  }
}

export const getOrderRangeBoundariesForSymbol = (orderRangePercentage: number, lastExecutedPrice: number) => {
  const varianceAmount = new Decimal(lastExecutedPrice).times(orderRangePercentage)
  return {
    upperBounds: varianceAmount.plus(lastExecutedPrice).toNumber(),
    lowerBounds: varianceAmount.mul(-1).plus(lastExecutedPrice).toNumber(),
  }
}
export const isAccountBoundByOrderRange = async (accountId: string) => {
  const [accountDetails, accountTypesToBeExcluded] = await Promise.all([
    findAccountById(accountId),
    getExcludedAccountTypesFromOrderRangeValidations(),
  ])

  return !accountTypesToBeExcluded.includes(accountDetails.type!)
}
