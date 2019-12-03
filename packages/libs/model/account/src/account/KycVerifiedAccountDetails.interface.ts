import { AccountType } from './AccountType.enum'
import { AccountStatus } from './AccountStatus.enum'
import { Address } from './Address.interface'
import { Gender } from './Gender.enum'

export interface KycVerifiedAccountDetails {
  id: string
  hin: string
  type: AccountType
  status: AccountStatus
  email: string
  passportNumber?: string
  passportExpiryDate?: string
  firstName?: string
  lastName?: string
  nationality?: string
  /* Has the format DD/MM/YYYYY */
  dateOfBirth?: string
  gender?: Gender
  address?: Address
}
