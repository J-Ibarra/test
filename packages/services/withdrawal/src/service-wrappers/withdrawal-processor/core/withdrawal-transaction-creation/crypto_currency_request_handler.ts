import { Logger } from '@abx-utils/logging'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { FatalError } from '@abx-types/error'
import { CurrencyCode } from '@abx-types/reference-data'
import { sendNotificationToOps } from '@abx-service-clients/notification'
import { dispatchWithdrawalTransaction } from './withdrawal-transaction-dispatcher'
import { CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'

const logger = Logger.getInstance('crypto_currency_request_handler', 'handleCryptoCurrencyWithdrawalRequest')

export async function handleCryptoCurrencyWithdrawalRequest(
  { id: withdrawalRequestId, amount, accountId, memo, address, currency }: CurrencyEnrichedWithdrawalRequest,
  onChainCurrencyGateway: OnChainCurrencyGateway,
) {
  logger.debug(`Initialising crypto Withdrawal for ${amount}: ${currency.code}, for account: ${accountId}`)

  const balanceForHoldings = await onChainCurrencyGateway.getHoldingBalance()

  logger.debug(`Validating whether ${currency.code} Holdings Address has sufficient balance`)

  if (balanceForHoldings < amount!) {
    await sendInsufficientHoldingsFundsEmailToOps(balanceForHoldings, accountId!, amount!, memo!, address!, currency.code)

    throw new FatalError('We are unable to automatically process your withdrawal right now but will manually process it in due course', {
      context: {
        amount,
        accountId,
        memo,
        address,
        currencyCode: currency.code,
      },
    })
  }

  await dispatchWithdrawalTransaction(withdrawalRequestId!, address!, amount, onChainCurrencyGateway, memo || '')

  logger.debug(`Withdrawal initialisation completed for ${amount} ${currency.code}, for account: ${accountId}`)
}

async function sendInsufficientHoldingsFundsEmailToOps(
  balanceForHoldings: number,
  accountId: string,
  amount: number,
  memo: string,
  address: string,
  currencyCode: CurrencyCode,
) {
  const errorMessage: string = `Holdings balance ${balanceForHoldings} is less than withdrawal request amount of ${amount} for ${currencyCode}`

  const messageContent = [
    errorMessage,
    '',
    `Account: ${accountId}`,
    `Amount: ${amount}`,
    `Memo: ${memo}`,
    `Target Address: ${address}`,
    `Currency code: ${currencyCode}`,
  ]

  logger.error(errorMessage)

  try {
    await sendNotificationToOps('Withdrawal amount greater than hot wallet balance', messageContent.join('. '), messageContent.join('<br />'))

    logger.info('Withdrawal amount greater than hot wallet balance message sent to OPs')
  } catch (e) {
    logger.error(e)
  }
}
