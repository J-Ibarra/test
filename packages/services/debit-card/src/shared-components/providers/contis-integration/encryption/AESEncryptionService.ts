import crypto from 'crypto'
import { Injectable } from '@nestjs/common'

import { EncryptionService } from './EncryptionService.interface'

@Injectable()
export class AESEncryptionService implements EncryptionService {
  encrypt(value: string, encryptionKey: string): string {
    const key = Buffer.from(encryptionKey.substring(32), 'hex')
    const iv = Buffer.from(encryptionKey.substring(0, 32), 'hex')

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(value, 'utf16le' as any, 'base64' as any)
    encrypted += cipher.final('base64')

    return encrypted
  }

  decrypt(value: string, decryptionKey: string): string {
    const key = Buffer.from(decryptionKey.substring(32), 'hex')
    const iv = Buffer.from(decryptionKey.substring(0, 32), 'hex')

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(value, 'base64' as any, 'utf16le' as any)
    decrypted += decipher.final('utf16le')

    return decrypted
  }
}
