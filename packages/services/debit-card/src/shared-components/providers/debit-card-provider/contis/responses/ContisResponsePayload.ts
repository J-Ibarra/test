import { EncryptionService } from '../../../contis-integration'

export interface ContisResponsePayload {
  decryptPayload(
    encryptionService: EncryptionService,
    decryptionKey: string,
  ): any
}
