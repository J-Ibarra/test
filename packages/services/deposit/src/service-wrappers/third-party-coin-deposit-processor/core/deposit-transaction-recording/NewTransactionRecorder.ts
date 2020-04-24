import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import {
  FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
  findDepositRequestsWhereTransactionHashPresent,
  createNewDepositRequest,
  getMinimumDepositAmountForCurrency,
} from '../../../../core'
import { Transaction } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddress, DepositRequestStatus } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { Decimal } from 'decimal.js'

interface NewTransactionDetails {
  currency: CurrencyCode
  depositAddress: DepositAddress
  depositTransactionDetails: Transaction
}

const logger = Logger.getInstance('public-coin-deposit-processor', 'NewTransactionRecorder')

/**
 * Responsible for processing potential new deposit request transactions.
 */
export class NewTransactionRecorder {
  async recordDepositTransaction({ currency, depositTransactionDetails, depositAddress }: NewTransactionDetails) {
    const transactionToBePersisted = await this.shouldPersistTransaction(depositTransactionDetails)

    if (transactionToBePersisted) {
      await this.persistTransactionDetails(currency, depositTransactionDetails, depositAddress)
    }
  }

  /**
   * We want to process the current address transaction as a deposit request if:
   * - we have not already recorded the deposit request for that transaction hash
   * - amount > 0
   */
  private async shouldPersistTransaction({ transactionHash, amount }: Transaction) {
    const existingDepositRequests = await findDepositRequestsWhereTransactionHashPresent(transactionHash)

    if (existingDepositRequests.length > 0) {
      logger.debug(`Attempted to process deposit address transaction ${transactionHash} which has already been recorded`)
    }

    return existingDepositRequests.length === 0 && amount > 0
  }

  /**
   * Creates a deposit request entry for the deposit transaction details.
   * In the case where the deposited amount is less than the defined minimum for the currency,
   * a 'insufficientAmount' status is used for the new record and it is not processed any further.
   */
  private async persistTransactionDetails(currency: CurrencyCode, depositTransactionDetails: Transaction, depositAddress: DepositAddress) {
    const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${currency}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)
    let depositAmountAboveMinimumForCurrency = getMinimumDepositAmountForCurrency(currency) <= depositTransactionDetails.amount

    const depositAmountFiatConversion = new Decimal(depositTransactionDetails.amount).times(fiatValueOfOneCryptoCurrency).toDP(2).toNumber()

    if (!depositAmountAboveMinimumForCurrency) {
      logger.debug(`Attempted to process deposit address transaction ${depositTransactionDetails.transactionHash} which has already been recorded`)
      await createNewDepositRequest(depositTransactionDetails, depositAddress, depositAmountFiatConversion, DepositRequestStatus.insufficientAmount)
    } else {
      await createNewDepositRequest(depositTransactionDetails, depositAddress, depositAmountFiatConversion)
    }
  }
}
