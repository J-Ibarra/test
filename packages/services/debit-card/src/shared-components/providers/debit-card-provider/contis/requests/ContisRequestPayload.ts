import { EncryptionService } from '../../../contis-integration'

export interface ContisRequestPayload {
  encryptPayload(
    encryptionService: EncryptionService,
    encryptionKey: string,
  ): ContisRequestPayload
}
