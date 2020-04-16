import { findWithdrawalRequests } from '../../../../../core'
import { WithdrawalState } from '@abx-types/withdrawal'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { verifySufficientAmountInHoldingWallet } from '../withdrawal_status_validators'
import { BitcoinOnChainCurrencyGatewayAdapter } from '@abx-utils/blockchain-currency-gateway'
import { recordTransactionSent } from '../withdrawal-transaction-dispatcher'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('crypto_currency_request_handler', 'processWaitingBitcoinWithdrawalRequests')

export async function processWaitingBitcoinWithdrawalRequests(onChainCurrencyGateway: BitcoinOnChainCurrencyGatewayAdapter) {
  let bitcoin = await findCurrencyForCode(CurrencyCode.bitcoin)

  const withdrawalRequests = await findWithdrawalRequests({ currencyId: bitcoin.id!, state: WithdrawalState.waiting })
  const totalWithdrawalAmount = withdrawalRequests.reduce((acc, { amount }) => acc + amount, 0)

  await verifySufficientAmountInHoldingWallet({
    amount: totalWithdrawalAmount,
    currency: CurrencyCode.bitcoin,
    onChainCurrencyGateway,
  })

  try {
    const { averageFeePerReceiver, txHash } = await onChainCurrencyGateway.transferFromExchangeHoldingsToMultipleReceivers({
      receivers: withdrawalRequests.map(({ amount, address }) => ({ address: address!, amount })),
    })
    logger.info(
      `Successfully created withdrawal transaction for waiting BTC withdrawal requests: ${withdrawalRequests.map(({ id }) => id).join(',')}`,
    )

    await Promise.all(withdrawalRequests.map(({ id }) => recordTransactionSent(id!, txHash, averageFeePerReceiver)))
  } catch (e) {
    logger.error('An error has ocurred while creating batch BTC withdrawal transaction')
    logger.error(JSON.stringify(e))

    throw e
  }
}
