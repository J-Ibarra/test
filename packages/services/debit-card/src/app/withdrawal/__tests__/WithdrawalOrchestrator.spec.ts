import { Test } from '@nestjs/testing'

import { CurrencyCode } from '../../../shared-components/models'
import { WithdrawalOrchestrator } from '../WithdrawalOrchestrator'
import { CardRepository, TransactionRepository } from '../../../shared-components/repositories'
import { WithdrawalExternalGateway } from '../WithdrawalExternalGateway'
import { CardConstraintService, BalanceSourceOfTruthComparator } from '../../../shared-components/providers'

const mockedCardRepository = {
  getDebitCardForAccount: jest.fn(),
  decreaseAvailableBalance: jest.fn(),
}

const mockedTransactionRepository = {
  createWithdrawalTransaction: jest.fn(),
}

const mockedWithdrawalExternalGateway = {
  executeWithdrawal: jest.fn(),
}

const mockedCardConstraintService = {
  getCardConstraintValue: jest.fn(),
}

const mockBalanceSourceOfTruthComparator = {
  syncCardBalanceWithSourceOfTruth: jest.fn(),
}

const mockedEntityManager = {} as any

const debitCardBalance = 100
const mockedDebitCard = {
  id: 1,
  currency: CurrencyCode.EUR,
  balance: debitCardBalance,
}
const mockedWithdrawalTransaction = {
  foo: 'bar',
}
const amountToWithdraw = 90
const providerTransactionId = 3
const accountId = '234'
const fee = 1.5

describe('WithdrawalOrchestrator', () => {
  let withdrawalOrchestrator: WithdrawalOrchestrator

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WithdrawalOrchestrator,
        {
          provide: CardRepository,
          useValue: mockedCardRepository,
        },
        {
          provide: BalanceSourceOfTruthComparator,
          useValue: mockBalanceSourceOfTruthComparator,
        },
        {
          provide: TransactionRepository,
          useValue: mockedTransactionRepository,
        },
        {
          provide: WithdrawalExternalGateway,
          useValue: mockedWithdrawalExternalGateway,
        },
        {
          provide: CardConstraintService,
          useValue: mockedCardConstraintService,
        },
      ],
    }).compile()

    withdrawalOrchestrator = module.get<WithdrawalOrchestrator>(WithdrawalOrchestrator)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should handle the workflow of withdrawing a certain amaunt of money from an account', async () => {
    jest.spyOn(mockedCardRepository, 'getDebitCardForAccount').mockReturnValue(mockedDebitCard)
    jest.spyOn(mockedWithdrawalExternalGateway, 'executeWithdrawal').mockReturnValue(providerTransactionId)
    jest.spyOn(mockedTransactionRepository, 'createWithdrawalTransaction').mockReturnValue(mockedWithdrawalTransaction)
    jest.spyOn(mockedCardConstraintService, 'getCardConstraintValue').mockResolvedValue(fee)
    jest.spyOn(mockBalanceSourceOfTruthComparator, 'syncCardBalanceWithSourceOfTruth').mockResolvedValue(debitCardBalance)
    jest.spyOn(mockedCardRepository, 'decreaseAvailableBalance')

    const result = await withdrawalOrchestrator.withdrawFundsToExchange(accountId, amountToWithdraw, mockedEntityManager)

    expect(mockedCardRepository.getDebitCardForAccount).toHaveBeenCalledWith(accountId, mockedEntityManager)
    expect(mockedWithdrawalExternalGateway.executeWithdrawal).toHaveBeenCalledWith(mockedDebitCard, amountToWithdraw, fee)
    expect(mockedTransactionRepository.createWithdrawalTransaction).toHaveBeenCalledWith(
      mockedDebitCard,
      amountToWithdraw,
      fee,
      providerTransactionId,
      mockedEntityManager,
    )
    expect(mockedCardRepository.decreaseAvailableBalance).toHaveBeenCalledWith(
      mockedDebitCard.id,
      amountToWithdraw + fee,
      mockedEntityManager,
    )
    expect(result).toEqual({
      withdrawalTransaction: mockedWithdrawalTransaction,
    })
  })

  it('should not handles the workflow if the amount to withdraw is more than the available', async () => {
    const higherAmountToWithdraw = 99999

    await expect(
      withdrawalOrchestrator.withdrawFundsToExchange(mockedDebitCard as any, higherAmountToWithdraw, mockedEntityManager),
    ).rejects.toThrowError()
  })
})
