import countries from 'i18n-iso-countries'
import { ContisRequestPayload } from './ContisRequestPayload'
import { Address } from '../../../../models'

export class ContisAddressDetails implements Address {
  addressLine1: string
  addressLine2: string
  addressLine3: string
  postCode: string
  country: string
  ISOCountryCode: string
  Town: string

  constructor(address: Address) {
    this.addressLine1 = address.addressLine1
    this.addressLine2 = address.addressLine2
    this.addressLine3 = address.addressLine3
    this.country = address.country
    this.postCode = address.postCode
    this.Town = address.addressLine3

    const countryAlpha3Code = countries.getAlpha3Code(address.country, 'en')
    this.ISOCountryCode = `${countries.alpha3ToNumeric(countryAlpha3Code)}`
  }
}

export interface ConsumerPersonalReq {
  FirstName: string
  LastName: string
  Gender: string
  DOB: string
  PresentAddress: ContisAddressDetails
  PreviousAddress?: ContisAddressDetails
  Relationship: number
  PassportNumber?: string
  PassportExpiryDate?: string
  Nationality?: string
  EmailAddress?: string
  IsPrimaryConsumer: boolean
}

export class AddConsumersRequest implements ContisRequestPayload {
  constructor(private ConsumerReqList: ConsumerPersonalReq[], private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      ConsumerReqList: this.ConsumerReqList,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
