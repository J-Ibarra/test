/** This will be further extended once we know all the details that will be received from the exchange. */
export enum UserStatus {
  kycVerified = 'kycVerified',
  emailVerified = 'emailVerified',
  registered = 'registered',
}

export enum Gender {
  male = 'M',
  female = 'F',
  unknown = 'U',
}

export interface Address {
  addressLine1: string
  addressLine2: string
  addressLine3: string
  postCode: string
  country: string
}

export class CompleteAccountDetails {
  id: string
  status: UserStatus
  firstName: string
  lastName: string
  /* Format of date must be 'yyyy-MM-dd'. */
  dateOfBirth: string
  gender: Gender
  nationality: string
  email?: string
  address?: Address
}
