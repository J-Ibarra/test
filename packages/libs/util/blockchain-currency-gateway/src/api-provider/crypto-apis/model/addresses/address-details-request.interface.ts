import { IBtcAddressDetailsRequest, IBtcAddressDetails } from './btc'
import { IAddressDetailsRequestEth, IAddressDetailsEth } from './eth'

export type IAddressDetailsRequest = IBtcAddressDetailsRequest | IAddressDetailsRequestEth

export type IAddressDetails = IBtcAddressDetails | IAddressDetailsEth
