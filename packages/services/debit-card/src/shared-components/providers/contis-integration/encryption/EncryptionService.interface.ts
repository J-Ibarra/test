export const ENCRYPTION_SERVICE = 'encryption-service'

/** The mechanism used for encrypting end decrypting request payloads. */
export interface EncryptionService {
  /**
   * Encrypts the value for a given request.
   *
   * @param value contains the value to be encrypted
   * @param encryptionKey the key used for encryption
   */
  encrypt(value: string, encryptionKey: string): string

  /**
   * Decrypts an encrypted value received from Contis.
   *
   * @param value a value from the response received from the Contis API
   * @param decryptionKey the key used for decryption
   */
  decrypt(value: string, decryptionKey: string): string
}
