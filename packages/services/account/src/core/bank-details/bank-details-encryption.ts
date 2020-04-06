import { decryptValue, encryptValue } from '@abx-utils/encryption'
import { PersonalBankDetails } from '@abx-types/account'

export async function decryptBankDetails(bankDetails: PersonalBankDetails): Promise<PersonalBankDetails> {
  const decryptedBankFields = await Promise.all(
    Object.keys(bankDetails).map(field => {
      if (field === 'id') {
        return Promise.resolve(bankDetails.id)
      }

      return !!bankDetails[field] ? decryptValue(bankDetails[field]) : Promise.resolve(bankDetails[field])
    }),
  )

  return Object.keys(bankDetails).reduce((decryptedDetails, key, idx) => {
    decryptedDetails[key] = decryptedBankFields[idx]

    return decryptedDetails
  }, {}) as PersonalBankDetails
}

export async function encryptBankDetails(bankDetails: PersonalBankDetails): Promise<PersonalBankDetails> {
  const encryptedBankFields = await Promise.all(
    Object.keys(bankDetails).map(field => {
      if (field === 'id') {
        return Promise.resolve(bankDetails.id)
      }

      return !!bankDetails[field] ? encryptValue(bankDetails[field]) : Promise.resolve(bankDetails[field])
    }) as any,
  )

  return Object.keys(bankDetails).reduce((encryptedDetails, key, idx) => {
    encryptedDetails[key] = encryptedBankFields[idx]

    return encryptedDetails
  }, {}) as PersonalBankDetails
}
