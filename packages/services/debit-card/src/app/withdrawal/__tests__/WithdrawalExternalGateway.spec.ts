import { Test } from '@nestjs/testing'

import { BALANCE_RESERVE_FACADE_TOKEN, CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers'
import { WithdrawalExternalGateway } from '../WithdrawalExternalGateway'
import { CurrencyCode } from '../../../shared-components/models'

const balanceReserveFacade = {
  recordCardToExchangeWithdrawal: jest.fn(),
}

const cardProviderFacadeFactory = {
  getCardProvider: () => cardProviderFacade,
}

const cardProviderFacade = {
  getProvider: jest.fn(),
  unloadBalance: jest.fn(),
}

const mockedDebitCard = {
  accountId: '1',
  provider: 'contis',
  providerAccountDetails: {
    foo: 'bar',
  },
  currency: CurrencyCode.EUR,
}
const amountToWithdraw = 100
const providerTransactionId = 3
const fee = 3

describe('WithdrawalExternalGateway', () => {
  let withdrawalExternalGateway: WithdrawalExternalGateway

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WithdrawalExternalGateway,
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: cardProviderFacadeFactory,
        },
        {
          provide: BALANCE_RESERVE_FACADE_TOKEN,
          useValue: balanceReserveFacade,
        },
      ],
    }).compile()

    withdrawalExternalGateway = module.get<WithdrawalExternalGateway>(WithdrawalExternalGateway)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should execute the withdrawal with the provided amount and return the transaction id', async () => {
    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider')
    jest.spyOn(cardProviderFacade, 'unloadBalance').mockReturnValue(providerTransactionId)
    jest.spyOn(balanceReserveFacade, 'recordCardToExchangeWithdrawal')

    const result = await withdrawalExternalGateway.executeWithdrawal(mockedDebitCard as any, amountToWithdraw, fee)

    expect(cardProviderFacadeFactory.getCardProvider).toHaveBeenCalledWith(mockedDebitCard.currency)
    expect(cardProviderFacade.getProvider).toHaveBeenCalled()
    expect(cardProviderFacade.unloadBalance).toHaveBeenCalledWith(mockedDebitCard.providerAccountDetails, amountToWithdraw + fee)
    expect(balanceReserveFacade.recordCardToExchangeWithdrawal).toHaveBeenCalledWith(
      mockedDebitCard.accountId,
      mockedDebitCard.currency,
      amountToWithdraw,
      providerTransactionId,
    )
    expect(result).toEqual(providerTransactionId)
  })
})
