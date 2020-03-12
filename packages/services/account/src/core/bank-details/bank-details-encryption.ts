import { decryptValue, encryptValue } from '@abx-utils/encryption'
import { PersonalBankDetails } from '@abx-types/account'

export async function decryptBankDetails(bankDetails: PersonalBankDetails): Promise<PersonalBankDetails> {
  const decryptedBankFields = await Promise.all(
    Object.keys(bankDetails).map(field => (field !== 'id' ? decryptValue(bankDetails[field]) : (Promise.resolve(bankDetails[field]) as any))),
  )

  return Object.keys(bankDetails).reduce((decryptedDetails, key, idx) => {
    decryptedDetails[key] = decryptedBankFields[idx]

    return decryptedDetails
  }, {}) as PersonalBankDetails
}

export async function encryptBankDetails(bankDetails: PersonalBankDetails): Promise<PersonalBankDetails> {
  const encryptedBankFields = await Promise.all(
    Object.keys(bankDetails).map(field =>
      field !== 'id' && !!bankDetails[field] ? encryptValue(bankDetails[field]) : Promise.resolve(bankDetails.id),
    ) as any,
  )

  return Object.keys(bankDetails).reduce((encryptedDetails, key, idx) => {
    encryptedDetails[key] = encryptedBankFields[idx]

    return encryptedDetails
  }, {}) as PersonalBankDetails
}
