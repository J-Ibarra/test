import { Logger } from '@abx-utils/logging'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { dispatchWithdrawalTransaction } from './withdrawal-transaction-dispatcher'
import { CurrencyEnrichedWithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'
import { waitingWithdrawalsExistForCurrency, verifySufficientAmountInHoldingWallet } from './withdrawal_status_validators'
import { updateWithdrawalRequest } from '../../../../core'

const logger = Logger.getInstance('crypto_currency_request_handler', 'handleCryptoCurrencyWithdrawalRequest')

export async function handleCryptoCurrencyWithdrawalRequest(
  { id: withdrawalRequestId, amount, accountId, memo, address, currency }: CurrencyEnrichedWithdrawalRequest,
  onChainCurrencyGateway: OnChainCurrencyGateway,
): Promise<void> {
  const withdrawalsInWaitingStateExist = await waitingWithdrawalsExistForCurrency(currency.id)
  if (withdrawalsInWaitingStateExist) {
    await updateWithdrawalRequest({
      state: WithdrawalState.waiting,
      id: withdrawalRequestId,
    })

    return
  }

  await verifySufficientAmountInHoldingWallet({
    accountId,
    amount,
    memo,
    address,
    currency: currency.code,
    onChainCurrencyGateway,
  })

  await dispatchWithdrawalTransaction(withdrawalRequestId!, address!, amount, onChainCurrencyGateway, memo || '')

  logger.debug(`Withdrawal initialisation completed for ${amount} ${currency.code}, for account: ${accountId}`)
}
