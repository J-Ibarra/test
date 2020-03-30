import { ContisRequestPayload } from './ContisRequestPayload'
import { EncryptionService } from '../../../contis-integration'

export class ActivateCardRequest implements ContisRequestPayload {
  constructor(
    private CardId: number,
    private DOB: string,
    private cvv: string,
    private ClientRequestReference: string,
  ) {}

  encryptPayload(encryptionService: EncryptionService, encryptionKey: string): ContisRequestPayload {
    return {
      CardId: this.CardId,
      DOB: this.DOB,
      ClientRequestReference: this.ClientRequestReference,
      EncryptedCVV: encryptionService.encrypt(this.cvv, encryptionKey),
    } as any
  }
}
