import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CardRepository } from '../../../../shared-components/repositories'
import { ContisTransactionRecorder } from '../ContisTransactionRecorder'
import { TransactionRepository } from '../../../../shared-components/repositories/TransactionRepository'
import { TransactionType } from '../../../../shared-components/models'

const cardRepository = {
  getDebitCardByProviderDetails: jest.fn(),
}

const transactionRepository = {
  recordTransaction: jest.fn(),
  findOne: jest.fn(),
}

const cardId = 12
const transactionId = 1
const incomingType = '006'
const outgoingType = 'outgoing'
const description = 'description'
const amount = 100
const mockDebitCard = {
  foo: 'bar',
}

describe('ContisTransactionRecorder', () => {
  let contisTransactionRecorder: ContisTransactionRecorder

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContisTransactionRecorder,
        {
          provide: getRepositoryToken(CardRepository),
          useValue: cardRepository,
        },
        {
          provide: getRepositoryToken(TransactionRepository),
          useValue: transactionRepository,
        },
      ],
    }).compile()

    contisTransactionRecorder = module.get<ContisTransactionRecorder>(ContisTransactionRecorder)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should record INCOMING transaction', async () => {
    jest.spyOn(cardRepository, 'getDebitCardByProviderDetails').mockResolvedValue(Promise.resolve(mockDebitCard))
    jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null)

    await contisTransactionRecorder.recordTransaction({
      CardID: cardId,
      TransactionType: incomingType,
      Description: description,
      AuthoriseAmount: amount,
      TransactionID: transactionId,
    })
    expect(transactionRepository.recordTransaction).toHaveBeenCalledWith({
      debitCard: mockDebitCard,
      type: TransactionType.incoming,
      description,
      amount,
      providerTransactionIdentifier: transactionId,
    })
  })

  it('should record OUTGOING transaction', async () => {
    jest.spyOn(cardRepository, 'getDebitCardByProviderDetails').mockImplementation(() => Promise.resolve(mockDebitCard))
    jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null)

    await contisTransactionRecorder.recordTransaction({
      CardID: cardId,
      TransactionType: outgoingType,
      Description: description,
      AuthoriseAmount: amount,
      TransactionID: transactionId,
    })
    expect(transactionRepository.recordTransaction).toHaveBeenCalledWith({
      debitCard: mockDebitCard,
      type: TransactionType.outgoing,
      description,
      amount,
      providerTransactionIdentifier: transactionId,
    })
  })

  it('should not record transaction with non-existing card id', async () => {
    jest.spyOn(cardRepository, 'getDebitCardByProviderDetails').mockImplementation(() => Promise.resolve(null))
    jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null)

    const result = await contisTransactionRecorder.recordTransaction({
      CardID: -1,
      TransactionType: outgoingType,
      Description: description,
      AuthoriseAmount: amount,
      TransactionID: transactionId,
    })
    await expect(result).toBe(false)
    expect(transactionRepository.recordTransaction).toHaveBeenCalledTimes(0)
  })

  it('should not record transaction if it has already been recorded', async () => {
    jest.spyOn(cardRepository, 'getDebitCardByProviderDetails').mockImplementation(() => Promise.resolve(null))
    jest.spyOn(transactionRepository, 'findOne').mockResolvedValue({})

    const result = await contisTransactionRecorder.recordTransaction({
      CardID: -1,
      TransactionType: outgoingType,
      Description: description,
      AuthoriseAmount: amount,
      TransactionID: transactionId,
    })
    await expect(result).toBe(false)
    expect(transactionRepository.recordTransaction).toHaveBeenCalledTimes(0)
  })
})
