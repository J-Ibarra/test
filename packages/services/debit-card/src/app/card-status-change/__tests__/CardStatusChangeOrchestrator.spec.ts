import { Test } from '@nestjs/testing'
import { CardStatusChangeOrchestrator } from '../CardStatusChangeOrchestrator'
/* tslint:disable-next-line:max-line-length */
import { CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../../shared-components/repositories'
import * as OrchestratorTestUtils from './CardStatusChangeOrchestrator.test-utils'
import { DebitCardStatus } from '../../../shared-components/models'

const newCardId = 2

describe('CardStatusChangeOrchestrator', () => {
  let cardStatusChangeOrchestrator: CardStatusChangeOrchestrator

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardStatusChangeOrchestrator,
        {
          provide: CardRepository,
          useValue: OrchestratorTestUtils.cardRepository,
        },
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: OrchestratorTestUtils.cardProviderFacadeFactory,
        },
      ],
    }).compile()

    cardStatusChangeOrchestrator = module.get<CardStatusChangeOrchestrator>(CardStatusChangeOrchestrator)
    jest.restoreAllMocks()
    jest.resetAllMocks()

    jest
      .spyOn(OrchestratorTestUtils.cardRepository, 'getDebitCardForAccount')
      .mockReturnValue(OrchestratorTestUtils.mockedDebitCard)
    jest
      .spyOn(OrchestratorTestUtils.cardProviderFacadeFactory, 'getCardProvider')
      .mockReturnValue(OrchestratorTestUtils.mockedCardProviderFacade)
    jest.spyOn(OrchestratorTestUtils.mockedCardProviderFacade, 'setCardAsLostWithReplacement').mockResolvedValue({
      newCardId,
    })
    jest.spyOn(OrchestratorTestUtils.mockedCardProviderFacade, 'setCardAsDamaged').mockResolvedValue({ newCardId })
    jest.spyOn(OrchestratorTestUtils.cardReplacementRequestRepository, 'createCardReplacementRequest')
  })

  /* tslint:disable-next-line:max-line-length */
  it('changeCardStatusToLostWithReplacement should use provider to set card as damaged and update status to lost', async () => {
    await cardStatusChangeOrchestrator.changeCardStatusToLostWithReplacement(
      OrchestratorTestUtils.accountId,
      OrchestratorTestUtils.entityManager,
    )

    expect(OrchestratorTestUtils.cardRepository.getDebitCardForAccount).toBeCalledWith(
      OrchestratorTestUtils.accountId,
      OrchestratorTestUtils.entityManager,
    )

    expect(OrchestratorTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.currency,
    )

    expect(OrchestratorTestUtils.mockedCardProviderFacade.setCardAsLostWithReplacement).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.providerAccountDetails,
    )

    expect(OrchestratorTestUtils.cardRepository.updateCardStatus).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.providerAccountDetails,
      DebitCardStatus.lost,
    )
  })

  /* tslint:disable-next-line:max-line-length */
  it('changeCardStatusToDamagedWithReplacement should use provider to set card as damaged and update status to damaged', async () => {
    await cardStatusChangeOrchestrator.changeCardStatusToDamagedWithReplacement(
      OrchestratorTestUtils.accountId,
      OrchestratorTestUtils.entityManager,
    )

    expect(OrchestratorTestUtils.cardRepository.getDebitCardForAccount).toBeCalledWith(
      OrchestratorTestUtils.accountId,
      OrchestratorTestUtils.entityManager,
    )

    expect(OrchestratorTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.currency,
    )

    expect(OrchestratorTestUtils.mockedCardProviderFacade.setCardAsDamaged).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.providerAccountDetails,
    )

    expect(OrchestratorTestUtils.cardRepository.updateCardStatus).toBeCalledWith(
      OrchestratorTestUtils.mockedDebitCard.providerAccountDetails,
      DebitCardStatus.damaged,
    )
  })
})
