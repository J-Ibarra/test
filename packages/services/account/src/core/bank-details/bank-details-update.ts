import { getModel } from '@abx/db-connection-utils'
import { PersonalBankDetails } from '@abx-types/account'
import { encryptBankDetails } from './bank-details-encryption'

export async function saveBankDetails(accountId: string, bankDetails: PersonalBankDetails): Promise<any> {
  const encryptedBankDetails = await encryptBankDetails(bankDetails)

  if (!!bankDetails.id) {
    return getModel<PersonalBankDetails>('bank_details').update(
      {
        ...encryptedBankDetails,
        accountId,
      },
      {
        where: { id: encryptedBankDetails.id! },
      },
    )
  }

  return getModel<PersonalBankDetails>('bank_details').create({
    ...encryptedBankDetails,
    accountId,
  })
}
