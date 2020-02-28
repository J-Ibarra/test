import { EncryptionService } from '../EncryptionService.interface'
import { AESEncryptionService } from '../AESEncryptionService'

describe('EncryptionService', () => {
  let service: EncryptionService
  const cardNumber = '4763580507487320'
  const encryptedCardNumber = 'c6T1M9hIAKr1K0qGCo7Ft5L4VupBuTbtYdhZ8zXHwAmzF2vREyDyMW/SzhHts0pA'
  const encryptionKey = 'e9de8858a76c406eb2cdde4a33f6e1b286ee3efccfb94506a7dfcfd04e9720bc46634d7679db40b1afa94cfe2d2f2018'

  beforeAll(async () => {
    service = new AESEncryptionService()
  })

  it('should encrypt text using AES256', async () => {
    expect(await service.encrypt(cardNumber, encryptionKey)).toBe(encryptedCardNumber)
  })

  it('should decrypt text using AES256 and return a string', async () => {
    expect(await service.decrypt(encryptedCardNumber, encryptionKey)).toBe(cardNumber)
  })
})
