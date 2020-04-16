import { findWithdrawalRequests } from '../../../../core'
import { WithdrawalState } from '@abx-types/withdrawal'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { sendNotificationToOps } from '@abx-service-clients/notification'
import { FatalError } from '@abx-types/error'

const logger = Logger.getInstance('withdrawal-processor', 'withdrawal_status_checkers')

export async function waitingWithdrawalsExistForCurrency(currencyId: number): Promise<boolean> {
  const waitingRequestsForCurrency = await findWithdrawalRequests({ currencyId, state: WithdrawalState.waiting })

  return waitingRequestsForCurrency.length > 0
}

export async function verifySufficientAmountInHoldingWallet({
  accountId,
  amount,
  currency,
  memo,
  address,
  onChainCurrencyGateway,
}: {
  accountId?: string
  amount: number
  currency: CurrencyCode
  memo?: string
  address?: string
  onChainCurrencyGateway: OnChainCurrencyGateway
}): Promise<void> {
  const holdingsBalance = await onChainCurrencyGateway.getHoldingBalance()
  logger.debug(`Validating whether ${currency} Holdings Address has sufficient balance`)

  if (holdingsBalance < amount!) {
    await sendInsufficientHoldingsFundsEmailToOps(holdingsBalance, accountId!, amount!, memo!, address!, currency)

    throw new FatalError('We are unable to automatically process your withdrawal right now but will manually process it in due course', {
      context: {
        amount,
        accountId,
        currencyCode: currency,
      },
    })
  }
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
