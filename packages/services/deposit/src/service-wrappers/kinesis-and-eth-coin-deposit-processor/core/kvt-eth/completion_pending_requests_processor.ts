import util from 'util'

import { noticeError } from 'newrelic'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { DepositCompleter, findDepositRequestsByHoldingsTransactionHash } from '../../../../core'
import { DepositGatekeeper } from '../common'

const SECONDS_TO_WAIT_BEFORE_ANOTHER_ATTEMPT = 5
const logger = Logger.getInstance('completion_pending_deposit_requests_processor', 'processCompletionPendingDepositRequestForCurrency')

export async function processCompletionPendingDepositRequestForCurrency(
  pendingCompletionGateKeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = pendingCompletionGateKeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }

  try {
    const onChainGateway = onChainCurrencyManager.getCurrencyFromTicker(currency)
    const depositTransactionConfirmed = await onChainGateway.checkConfirmationOfTransaction(depositRequest.holdingsTxHash!)
    if (!depositTransactionConfirmed) {
      logger.warn(`Attempted to complete deposit request ${depositRequest.id} where the transaction into the holdings account is not yet confirmed`)
      return postponeDepositCompletion(pendingCompletionGateKeeper, currency, depositRequest)
    }

    await completeDepositsForHoldingsTransaction(depositRequest.holdingsTxHash!, currency)
    logger.info(`Deposit request ${depositRequest.id} successfully completed`)

    pendingCompletionGateKeeper.removeRequest(currency, depositRequest.id!)
  } catch (e) {
    logger.error(`Error encountered while process new deposit for ${currency}: ${depositRequest.id}`)
    logger.error(JSON.stringify(util.inspect(e)))

    noticeError(e, {
      currency,
      amount: depositRequest.amount.toString(),
      depositAddress: depositRequest.depositAddress.publicKey,
    })

    return postponeDepositCompletion(pendingCompletionGateKeeper, currency, depositRequest)
  }
}

function postponeDepositCompletion(gateKeeper: DepositGatekeeper, currency: CurrencyCode, depositRequest: DepositRequest) {
  gateKeeper.removeRequest(currency, depositRequest.id!)
  gateKeeper.addNewDepositsForCurrency(currency, [depositRequest], SECONDS_TO_WAIT_BEFORE_ANOTHER_ATTEMPT)
}

async function completeDepositsForHoldingsTransaction(txid: string, currencyCode: CurrencyCode) {
  const depositRequests = await findDepositRequestsByHoldingsTransactionHash(txid)

  const depositCompleter = new DepositCompleter()
  await depositCompleter.completeDepositRequests(depositRequests, currencyCode, DepositRequestStatus.completed)
}
