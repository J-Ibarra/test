import util from 'util'

import { findUserByAccountId } from '@abx-service-clients/account'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { Email, EmailTemplates } from '@abx-types/notification'
import { createEmail } from '@abx-service-clients/notification'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalRequest, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { completeCryptoWithdrawal } from '../../lib/completion/crypto'
import { CryptoWithdrawalGatekeeper } from '../withdrawals_gatekeeper'

const logger = Logger.getInstance('crypto_request_completer', 'completeCryptoDeposit')
const timeToWaitBeforeReattemptingCompletion = 60

export async function completeWithdrawal(
  currencyCode: CurrencyCode,
  currencyManager: CurrencyManager,
  pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper,
) {
  const latestWithdrawalWaitingCompletion = pendingCompletionGatekeeper.getLatestWithdrawalForCurrency(currencyCode)

  if (!latestWithdrawalWaitingCompletion) {
    return
  }

  const { withdrawalRequest, feeRequest } = latestWithdrawalWaitingCompletion

  const isWithdrawalTransactionConfirmed = await withdrawalTransactionConfirmed(currencyCode, withdrawalRequest, currencyManager)

  if (!isWithdrawalTransactionConfirmed) {
    logger.info(
      `Transaction for withdrawal request ${withdrawalRequest.id} not yet confirmed will try again in ${timeToWaitBeforeReattemptingCompletion} seconds`,
    )
    return addRequestForLaterAttempt(pendingCompletionGatekeeper, currencyCode, withdrawalRequest, feeRequest)
  }

  try {
    await completeCryptoWithdrawal(withdrawalRequest, feeRequest)

    pendingCompletionGatekeeper.removeRequest(currencyCode, withdrawalRequest.id!)
  } catch (error) {
    logger.error(
      `An error occurred while completing withdrawal request ${withdrawalRequest.id} ${
        !!feeRequest ? 'with fee request' + feeRequest.id : 'with no fee request'
      }`,
    )
    logger.error(JSON.stringify(util.inspect(error)))

    addRequestForLaterAttempt(pendingCompletionGatekeeper, currencyCode, withdrawalRequest, feeRequest)
  }

  try {
    await sendCryptoWithdrawalSuccessEmail(withdrawalRequest)
  } catch (err) {
    logger.error(`Unable to send email for withdrawal request ${withdrawalRequest.id}`)
  }
}

async function withdrawalTransactionConfirmed(
  currencyCode: CurrencyCode,
  completionPendingWithdrawal: WithdrawalRequest,
  currencyManager: CurrencyManager,
) {
  try {
    const onChainCurrencyGateway = currencyManager.getCurrencyFromTicker(currencyCode)

    return onChainCurrencyGateway.checkConfirmationOfTransaction(completionPendingWithdrawal.txHash!)
  } catch (error) {
    logger.error(`An error occurred while checking transaction confirmation for withdrawal request ${completionPendingWithdrawal.id}`)
    logger.error(JSON.stringify(util.inspect(error)))

    return false
  }
}

function addRequestForLaterAttempt(
  pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper,
  currency: CurrencyCode,
  completionPendingWithdrawal: CurrencyEnrichedWithdrawalRequest,
  feeRequest?: CurrencyEnrichedWithdrawalRequest | null,
) {
  pendingCompletionGatekeeper.removeRequest(currency, completionPendingWithdrawal.id!)

  pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(
    currency,
    { withdrawalRequest: completionPendingWithdrawal, feeRequest: feeRequest },
    timeToWaitBeforeReattemptingCompletion,
  )
}

async function sendCryptoWithdrawalSuccessEmail(withdrawalRequest: CurrencyEnrichedWithdrawalRequest) {
  if (isFiatCurrency(withdrawalRequest.currency!.code)) {
    return
  }

  const user = await findUserByAccountId(withdrawalRequest.accountId)
  if (!user) {
    logger.error(`An error occurred while sending crypto withdrawal success email ${withdrawalRequest.id}: can not find user detail`)
    return
  }

  const { email, firstName, lastName } = user
  const name = !!firstName && !!lastName ? `${firstName} ${lastName}` : ''

  const templateContent = {
    name,
    withdrawalAmount: `${withdrawalRequest.amount}`,
    cryptoSymbol: withdrawalRequest.currency.code,
    username: email,
    withdrawalDateUTC: withdrawalRequest.createdAt!.toUTCString(),
    depositPublicAddress: withdrawalRequest.address!,
    transactionHash: withdrawalRequest.txHash!,
  }
  const emailRequest: Email = {
    to: email,
    subject: 'Kinesis Money Crypto Withdraw Success',
    templateName: EmailTemplates.WithdrawalCryptoSuccess,
    templateContent,
  }

  logger.info(`Send crypto withdraw success email for withdrawal request: ${withdrawalRequest.id}`)
  logger.info(JSON.stringify(templateContent))

  return createEmail(emailRequest)
}
