import Decimal from 'decimal.js'
import * as moment from 'moment'
import { findAccountById } from '@abx-service-clients/account'
import { findBoundaryForCurrency, getCurrencyCode, formatCurrencyValue, getBoundariesForCurrencies } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { OrderDirection } from '@abx-types/order'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { OrderMatchData, ReportData } from '@abx-service-clients/report'
import { findTradeTransactionFromOrderMatch } from './trade_transaction_report_helpers'
import { getFeeRateForAccount } from '../fees'

const logger = Logger.getInstance('trade transaction report', 'generate report data for rendering')

export async function generateTradeTransactionReportData(orderMatchData: OrderMatchData): Promise<ReportData> {
  const { accountId, orderMatchId, orderIds, direction, date, amount, baseCurrency, quoteCurrency, matchPrice, consideration } = orderMatchData
  const orderId = direction === OrderDirection.buy ? orderIds.buyOrderId : orderIds.sellOrderId

  const { fee, tradeTransactionId, feeCurrencyId } = await findTradeTransactionFromOrderMatch({
    orderMatchId,
    orderIds,
    direction,
  })

  const { hin: accountHin } = await findAccountById(accountId)
  const feeCurrency = await getCurrencyCode(feeCurrencyId, SymbolPairStateFilter.all)

  const formattedFee = await truncateFees(fee, feeCurrency!)
  const feePercent = await getFeeRateForAccount({ accountId, symbolId: `${baseCurrency}_${quoteCurrency}` })

  logger.debug(`Fetched client data: ${accountHin!}`)

  const STATIC_RESOURCES = 'https://s3-ap-southeast-2.amazonaws.com/kbe-report-templates/static-resources'
  const isBuying: boolean = direction === OrderDirection.buy
  const feeCurrencyIsBase: boolean = feeCurrency === baseCurrency

  const { paidCurrencyCode, totalPaid, totalReceived } = determineTotalCurrencyValues({
    amount,
    feeCurrencyIsBase,
    fee: formattedFee,
    matchPrice,
    quoteCurrency,
    baseCurrency,
    isBuying,
  })

  const {
    [quoteCurrency]: quoteCurrencyBoundary,
    [paidCurrencyCode]: paidCurrencyBoundary,
    [totalReceived.currencyCode]: receivedCurrencyBoundary,
  } = await getBoundariesForCurrencies([quoteCurrency, feeCurrency!, paidCurrencyCode, baseCurrency])

  const feeCurrencyBoundary = feeCurrency === paidCurrencyCode ? paidCurrencyBoundary : quoteCurrencyBoundary

  const data: ReportData = {
    content: {
      $staticResources: `${STATIC_RESOURCES}/css`,
      account: {
        hin: accountHin!,
        companyRegistrationId: '', // in SF??? not saved
        fullAddress: 'Account address', // in SF??? not saved
      },
      tradeTransaction: {
        direction: direction.toUpperCase(),
        tradingParty: isBuying ? 'Buyer' : 'Seller',
        orderId,
        tradeTransactionId: tradeTransactionId!,
        utcTime: moment.utc(date).format('YYYY-MM-DD hh:mm'),
        baseCurrency,
        quoteCurrency,
        amount,
        matchPrice: await formatCurrencyValue({
          value: {
            currencyCode: quoteCurrency,
            value: matchPrice,
          },
          boundary: quoteCurrencyBoundary,
        }),
        consideration: await formatCurrencyValue({
          value: {
            currencyCode: quoteCurrency,
            value: consideration!,
          },
          boundary: quoteCurrencyBoundary,
          appendCurrencyCode: true,
        }),
        totalPaid: await formatCurrencyValue({ value: totalPaid, boundary: paidCurrencyBoundary, appendCurrencyCode: true }),
        totalReceived: await formatCurrencyValue({ value: totalReceived, boundary: receivedCurrencyBoundary, appendCurrencyCode: true }),
      },
      transactionFee: {
        fee: await formatCurrencyValue({
          value: {
            currencyCode: feeCurrency!,
            value: formattedFee,
          },
          boundary: feeCurrencyBoundary,
          appendCurrencyCode: true,
        }),
        feePercent: feePercent || 0,
        feeCurrency: feeCurrency!,
      },
      footer: {
        imgSrc: `${STATIC_RESOURCES}/images/Kinesis_logo.png`,
        email: 'info@kinesis.money',
      },
    },
    identifier: tradeTransactionId!,
    accountId,
  }

  return data
}

function determineTotalCurrencyValues({ feeCurrencyIsBase, baseCurrency, quoteCurrency, matchPrice, amount, fee, isBuying }) {
  const paidCurrencyCode: CurrencyCode = isBuying ? quoteCurrency : baseCurrency
  const receivedCurrencyCode: CurrencyCode = isBuying ? baseCurrency : quoteCurrency
  const finalMatchPrice = new Decimal(matchPrice).mul(amount)

  if (feeCurrencyIsBase) {
    return {
      paidCurrencyCode,
      totalPaid: {
        currencyCode: paidCurrencyCode,
        value: isBuying ? finalMatchPrice.toNumber() : amount + fee,
      },
      totalReceived: {
        currencyCode: receivedCurrencyCode,
        value: isBuying ? amount - fee : finalMatchPrice.toNumber(),
      },
    }
  } else {
    return {
      paidCurrencyCode,
      totalPaid: {
        currencyCode: paidCurrencyCode,
        value: isBuying ? finalMatchPrice.plus(fee).toNumber() : amount,
      },
      totalReceived: {
        currencyCode: receivedCurrencyCode,
        value: isBuying ? amount : finalMatchPrice.minus(fee).toNumber(),
      },
    }
  }
}

async function truncateFees(fee: number, feeCurrency: CurrencyCode): Promise<number> {
  const feeCurrencyBoundary = await findBoundaryForCurrency(feeCurrency)

  return new Decimal(fee).toDP(feeCurrencyBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber()
}
