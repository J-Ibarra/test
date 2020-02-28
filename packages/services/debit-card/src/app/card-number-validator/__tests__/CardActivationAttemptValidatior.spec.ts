import { CardActivationAttemptValidator } from '../CardActivationAttemptValidatior'
import moment = require('moment')

const cardActivationAttemptRepository = {
  getActivationAttemptsForCard: jest.fn(),
  insertActivationAttemptRecordForCard: jest.fn(),
  resetAttemptsForCard: jest.fn(),
  incrementActivationAttemptsForCard: jest.fn(),
} as any

describe('CardActivationAttemptValidator', () => {
  let cardActivationAttemptValidator: CardActivationAttemptValidator

  beforeEach(async () => {
    jest.resetAllMocks()
    cardActivationAttemptValidator = new CardActivationAttemptValidator(cardActivationAttemptRepository)
  })

  it('should return an attemptsExceeded false record when attempts no record found', async () => {
    jest.spyOn(cardActivationAttemptRepository, 'getActivationAttemptsForCard').mockReturnValue(null)

    const mockCard = {
      id: 1,
    } as any
    const result = await cardActivationAttemptValidator.maximumDailyActivationAttemptsExceeded(mockCard)

    expect(result.attemptsExceeded).toEqual(false)
  })

  it('should return an attemptsExceeded false record when attempts were exceeded more than 24 hour ago', async () => {
    jest.spyOn(cardActivationAttemptRepository, 'getActivationAttemptsForCard').mockReturnValue({
      attempts: 11,
      updatedAt: moment()
        .subtract(25, 'hours')
        .toDate(),
    })

    const mockCard = {
      id: 1,
    } as any
    const result = await cardActivationAttemptValidator.maximumDailyActivationAttemptsExceeded(mockCard)

    expect(result.attemptsExceeded).toEqual(false)
  })

  it('should return an attemptsExceeded true record when attempts were exceed MAXIMUM_ALLOWED_ACTIVATION_ATTEMPTS', async () => {
    jest.spyOn(cardActivationAttemptRepository, 'getActivationAttemptsForCard').mockReturnValue({
      attempts: 11,
      updatedAt: moment()
        .subtract(14, 'hours')
        .toDate(),
    })

    const mockCard = {
      id: 1,
    } as any
    const result = await cardActivationAttemptValidator.maximumDailyActivationAttemptsExceeded(mockCard)

    expect(result.attemptsExceeded).toEqual(true)
  })
})
