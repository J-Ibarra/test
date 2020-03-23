import { EncryptionService } from '../../../contis-integration'
import { ContisResponsePayload } from './ContisResponsePayload'

export interface ViewDecryptResponse {
  DecryptedPin: string
  Description: string
  ResponseCode: string
  ClientRequestReference: string
}

export class ViewPinResponse implements ContisResponsePayload {
  EncryptedPin: string
  Description: string
  ResponseCode: string
  ClientRequestReference: string

  constructor(contisResponse: any) {
    this.EncryptedPin = contisResponse.EncryptedPin
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ResponseCode
  }

  decryptPayload(
    encryptionService: EncryptionService,
    decryptionKey: string,
  ): ViewDecryptResponse {
    return {
      ...this,
      DecryptedPin: encryptionService.decrypt(
        this.EncryptedPin,
        decryptionKey,
      ),
    } as any
  }
}
