import Decimal from 'decimal.js'
import * as moment from 'moment'
import { findAccountById } from '../../../../accounts'
import { findBoundaryForCurrency } from '../../../../boundaries'
import { Logger } from '../../../../config/logging'
import { formatCurrencyValue } from '../../../../currencies/lib/helpers'
import sequelize from '../../../../db/abx_modules'
import { wrapInTransaction } from '../../../../db/transaction_wrapper'
import { OrderDirection } from '../../../../orders/interface'
import { CurrencyCode, getCurrencyCode } from '../../../../symbols'
import { OrderMatchData, ReportData } from '../../../interfaces'
import { findTradeTransactionFromOrderMatch } from './trade_transaction_report_helpers'

const logger = Logger.getInstance('trade transaction report', 'generate report data for rendering')

export async function generateTradeTransactionReportData(orderMatchData: OrderMatchData): Promise<ReportData> {
  const { accountId, orderMatchId, orderIds, direction, date, amount, baseCurrency, quoteCurrency, matchPrice, consideration } = orderMatchData
  const orderId = direction === OrderDirection.buy ? orderIds.buyOrderId : orderIds.sellOrderId

  const { fee, tradeTransactionId, feeCurrencyId } = await findTradeTransactionFromOrderMatch({
    orderMatchId,
    orderIds,
    direction,
  })

  const { hin, feeCurrency } = await wrapInTransaction(sequelize, null, async t => {
    const { hin: accountHin } = await findAccountById(accountId, t)
    const currency = await getCurrencyCode(feeCurrencyId)

    return {
      hin: accountHin,
      feeCurrency: currency,
    }
  })

  const formattedFee = await truncateFees(fee, feeCurrency)

  logger.debug(`Fetched client data: ${hin}`)

  const STATIC_RESOURCES = 'https://s3-ap-southeast-2.amazonaws.com/kbe-report-templates/static-resources'
  const isBuying: boolean = direction === OrderDirection.buy
  const feeCurrencyIsBase: boolean = feeCurrency === baseCurrency

  const { totalPaid, totalReceived } = determineTotalCurrencyValues({
    amount,
    feeCurrencyIsBase,
    fee: formattedFee,
    matchPrice,
    quoteCurrency,
    baseCurrency,
    isBuying,
  })

  const feePercent: number = new Decimal(fee)
    .div(feeCurrencyIsBase ? amount : consideration)
    .mul(100)
    .toDP(2)
    .toNumber()

  const data: ReportData = {
    data: {
      $staticResources: `${STATIC_RESOURCES}/css`,
      account: {
        hin,
        companyRegistrationId: '', // in SF??? not saved
        fullAddress: 'Account address', // in SF??? not saved
      },
      tradeTransaction: {
        direction: direction.toUpperCase(),
        tradingParty: isBuying ? 'Buyer' : 'Seller',
        orderId,
        tradeTransactionId,
        utcTime: moment.utc(date).format('YYYY-MM-DD hh:mm'),
        baseCurrency,
        quoteCurrency,
        amount,
        matchPrice: await formatCurrencyValue(
          {
            currencyCode: quoteCurrency,
            value: matchPrice,
          },
          true,
        ),
        consideration: await formatCurrencyValue(
          {
            currencyCode: quoteCurrency,
            value: consideration,
          },
          true,
        ),
        totalPaid: await formatCurrencyValue(totalPaid, true),
        totalReceived: await formatCurrencyValue(totalReceived, true),
      },
      transactionFee: {
        fee: await formatCurrencyValue(
          {
            currencyCode: feeCurrency,
            value: formattedFee,
          },
          true,
        ),
        feePercent,
        feeCurrency,
      },
      footer: {
        imgSrc: `${STATIC_RESOURCES}/images/Kinesis_logo.png`,
        email: 'info@kinesis.money',
      },
    },
    identifier: tradeTransactionId,
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
