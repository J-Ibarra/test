import { Logger } from '@abx/logging'
import { OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { FatalError } from '@abx-types/error'
import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { InitialiseWithdrawalParams } from '@abx-types/withdrawal'
import { initialiseCryptoWithdrawalRequest } from '../../lib'
import { CryptoWithdrawalGatekeeper } from '../withdrawals_gatekeeper'
import { sendNotificationToOps } from '@abx-service-clients/notification'

const logger = Logger.getInstance('crypto_currency_request_handler', 'handleCryptoCurrencyWithdrawalRequest')

export async function handleCryptoCurrencyWithdrawalRequest(
  { amount, accountId, memo, address }: Partial<InitialiseWithdrawalParams>,
  withdrawalRequestCurrency: Currency,
  feeCurrency: Currency,
  onChainCurrencyGateway: OnChainCurrencyGateway,
  pendingHoldingsAccountTransferGatekeeper: CryptoWithdrawalGatekeeper,
) {
  const currencyCode = onChainCurrencyGateway.ticker

  logger.debug(`Initialising crypto Withdrawal for ${amount}: ${currencyCode}, for account: ${accountId}`)

  const balanceForHoldings = await onChainCurrencyGateway.getHoldingBalance()

  logger.debug(`Validating whether ${currencyCode} Holdings Address has sufficient balance`)

  if (balanceForHoldings < amount!) {
    await sendInsufficientHoldingsFundsEmailToOps(balanceForHoldings, accountId!, amount!, memo!, address!, currencyCode!)

    throw new FatalError('We are unable to automatically process your withdrawal right now but will manually process it in due course', {
      context: {
        amount,
        accountId,
        memo,
        address,
        currencyCode,
      },
    })
  }

  const { amountRequest, feeRequest } = await initialiseCryptoWithdrawalRequest(
    {
      accountId: accountId!,
      address,
      amount: amount!,
      currencyCode: currencyCode!,
      memo,
    },
    withdrawalRequestCurrency,
    feeCurrency,
  )

  pendingHoldingsAccountTransferGatekeeper.addNewWithdrawalRequestForCurrency(currencyCode!, {
    withdrawalRequest: { ...amountRequest, currency: withdrawalRequestCurrency },
    feeRequest: !!feeRequest ? feeRequest : undefined,
  })
  logger.debug(`Withdrawal initialisation completed for ${amount} ${currencyCode}, for account: ${accountId}`)
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
