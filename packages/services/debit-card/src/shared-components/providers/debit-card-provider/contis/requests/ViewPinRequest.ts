import { ContisRequestPayload } from './ContisRequestPayload'
import { EncryptionService } from '../../../contis-integration'

export class ViewPinRequest implements ContisRequestPayload {
  constructor(
    private CardId: number,
    private DOB: string,
    private ClientRequestReference: string,
    private cvv: string,
  ) {}

  encryptPayload(encryptionService: EncryptionService, encryptionKey: string): ContisRequestPayload {
    return {
      CardId: this.CardId,
      DOB: this.DOB,
      ClientRequestReference: this.ClientRequestReference,
      EncryptedCVV: encryptionService.encrypt(this.cvv, encryptionKey)
    } as any
  }
}
