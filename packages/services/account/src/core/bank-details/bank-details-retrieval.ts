import { getModel } from '@abx/db-connection-utils'
import { PersonalBankDetails } from '@abx-types/account'
import { decryptBankDetails } from './bank-details-encryption'

export async function getBankDetailsForAccount(accountId: string) {
  const bankDetailsInstance = await getModel<PersonalBankDetails>('bank_details').findOne({
    include: [
      {
        model: getModel<Account>('account'),
        as: 'account',
        where: { id: accountId },
      },
    ],
  })

  if (!!bankDetailsInstance) {
    const bankDetails = bankDetailsInstance.get()
    delete bankDetails.accountId
    delete (bankDetails as any).account

    return decryptBankDetails(bankDetails)
  }

  return null
}
