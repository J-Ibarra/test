import { Email, EmailTemplates } from '@abx-types/notification'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { findUserByAccountId } from '@abx-service-clients/account'
import { createEmail } from '@abx-service-clients/notification'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('withdrawal-processor', 'withdrawal_completion_email_sender')

export async function sendCryptoWithdrawalSuccessEmail(withdrawalRequest: CurrencyEnrichedWithdrawalRequest) {
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
