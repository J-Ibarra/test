import { User } from '@abx-types/account'
import { getOperationsEmail } from '@abx-service-clients/reference-data'
import { Email, EmailTemplates } from '@abx-types/notification'
import { WithdrawalRequestEmailTemplateContent, WithdrawalSummary } from '@abx-types/withdrawal'

/** Sends a withdrawal request email to the admin operator account. */
export async function prepareWithdrawalRequestEmail(
  user: Partial<User>,
  hin: string,
  { currency, amount }: WithdrawalSummary,
) {
  const operationsEmail = await getOperationsEmail()

  const withdrawalRequestEmailParams: Email = {
    subject: 'Kinesis Money Withdrawal Request',
    templateName: EmailTemplates.WithdrawalRequest,
    to: operationsEmail,
    templateContent: {
      firstName: user.firstName,
      lastName: user.lastName,
      hin,
      currencySymbol: currency,
      withdrawalAmount: new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
      }).format(amount),
    } as WithdrawalRequestEmailTemplateContent,
  }

  return withdrawalRequestEmailParams
}
