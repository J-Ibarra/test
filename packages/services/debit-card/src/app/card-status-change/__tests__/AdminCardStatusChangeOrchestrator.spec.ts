import { AdminCardStatusChangeOrchestrator } from '../AdminCardStatusChangeOrchestrator'
import {
  cardProviderFacadeFactory,
  cardRepository,
  accountId,
  mockedCardProviderFacade,
  mockedDebitCard,
} from './CardStatusChangeOrchestrator.test-utils'
import { DebitCardStatus } from '../../../shared-components/models'

describe('AdminCardStatusChangeOrchestrator', () => {
  let adminCardStatusChangeOrchestrator: AdminCardStatusChangeOrchestrator

  beforeEach(() => {
    adminCardStatusChangeOrchestrator = new AdminCardStatusChangeOrchestrator(cardProviderFacadeFactory, cardRepository)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('changeAccountCardStatusToSuspended should suspend account and update card status to suspended', async () => {
    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)

    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue(mockedDebitCard)

    await adminCardStatusChangeOrchestrator.changeAccountCardStatusToSuspended(accountId)

    expect(mockedCardProviderFacade.suspendAccount).toHaveBeenCalledWith(mockedDebitCard.providerAccountDetails)
    expect(cardRepository.updateCardStatus).toHaveBeenCalledWith(
      mockedDebitCard.providerAccountDetails,
      DebitCardStatus.suspended,
    )
  })

  /* tslint:disable-next-line:max-line-length */
  it('putSuspendedAccountCardBackToNormal should account back to normal and update card status to suspended', async () => {
    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)

    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue(mockedDebitCard)

    await adminCardStatusChangeOrchestrator.putSuspendedAccountCardBackToNormal(accountId)

    expect(mockedCardProviderFacade.setAccountBackToNormal).toHaveBeenCalledWith(mockedDebitCard.providerAccountDetails)
    expect(cardRepository.updateCardStatus).toHaveBeenCalledWith(
      mockedDebitCard.providerAccountDetails,
      DebitCardStatus.active,
    )
  })
})
