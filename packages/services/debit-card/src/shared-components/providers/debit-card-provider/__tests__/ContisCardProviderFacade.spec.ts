import { Test } from '@nestjs/testing'
import { ContisCardProviderFacade, INACTIVE_CARD_STATUS } from '../ContisCardProviderFacade'
import { UserStatus, ContisAccountDetails } from '../../../models'
import { getUserDetails, getContisAccountDetails } from './stubbed-responses.data'
import { ContisQueryHandler } from '../contis/ContisQueryHandler'
import { ContisUpdateHandler } from '../contis/ContisUpdateHandler'

const contisAccountDetails = {
  consumerId: 12,
  accountId: 123,
  cardId: 1111,
} as ContisAccountDetails

const cvv = '123'
const dob = '1960-05-24'
const amount = 200
const lastFourDigits = '6789'
const presentAddress = {
  addressLine1: 'Flat 61',
  addressLine2: '120 Melbourne street',
  addressLine3: 'Brisbane',
  postCode: '1000',
  country: 'Australia',
}

describe('ContisCardProviderFacade', () => {
  let contisCardProviderFacade: ContisCardProviderFacade

  const contisQueryHandler = {
    getPin: jest.fn(),
    getActiveCardDetails: jest.fn(),
    validateLastFourDigits: jest.fn(),
    listCards: jest.fn(),
  }

  const contisUpdateHandler = {
    loadBalance: jest.fn(),
    unloadBalance: jest.fn(),
    createAccount: jest.fn(),
    lockCard: jest.fn(),
    setCardAsLostWithReplacement: jest.fn(),
    setCardAsDamaged: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContisCardProviderFacade,
        {
          provide: ContisQueryHandler,
          useValue: contisQueryHandler,
        },
        {
          provide: ContisUpdateHandler,
          useValue: contisUpdateHandler,
        },
      ],
    }).compile()

    contisCardProviderFacade = module.get<ContisCardProviderFacade>(ContisCardProviderFacade)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call createAccount', async () => {
    jest.spyOn(contisUpdateHandler, 'createAccount')

    await contisCardProviderFacade.createAccount(getUserDetails(UserStatus.kycVerified), presentAddress)

    expect(contisUpdateHandler.createAccount).toBeCalledWith(getUserDetails(UserStatus.kycVerified), presentAddress)
  })

  it('should call loadBalance', async () => {
    jest.spyOn(contisUpdateHandler, 'loadBalance')

    await contisCardProviderFacade.loadBalance(1, getContisAccountDetails(), amount)

    expect(contisUpdateHandler.loadBalance).toBeCalledWith(1, getContisAccountDetails(), amount)
  })

  it('should call unloadBalance', async () => {
    jest.spyOn(contisUpdateHandler, 'unloadBalance')

    await contisCardProviderFacade.unloadBalance(getContisAccountDetails(), amount)

    expect(contisUpdateHandler.unloadBalance).toBeCalledWith(getContisAccountDetails(), amount)
  })

  it('should call getPin', async () => {
    jest.spyOn(contisQueryHandler, 'getPin')

    await contisCardProviderFacade.getPin(contisAccountDetails, cvv, dob)

    expect(contisQueryHandler.getPin).toHaveBeenCalledWith(contisAccountDetails, cvv, dob)
  })

  it('should call validateLastFourDigits', async () => {
    jest.spyOn(contisQueryHandler, 'validateLastFourDigits')

    await contisCardProviderFacade.validateLastFourDigits(contisAccountDetails, lastFourDigits)

    expect(contisQueryHandler.validateLastFourDigits).toBeCalledWith(contisAccountDetails, lastFourDigits)
  })

  it('should call getActiveCardDetails', async () => {
    jest.spyOn(contisQueryHandler, 'getActiveCardDetails')

    await contisCardProviderFacade.getActiveCardDetails(contisAccountDetails)

    expect(contisQueryHandler.getActiveCardDetails).toBeCalledWith(contisAccountDetails)
  })

  it('should call setCardAsLostWithReplacement', async () => {
    const newCardId = 2
    jest.spyOn(contisUpdateHandler, 'setCardAsLostWithReplacement')
    jest.spyOn(contisQueryHandler, 'listCards').mockResolvedValue({
      CardResList: [
        {
          CardID: newCardId,
          CardStatus: INACTIVE_CARD_STATUS,
        },
        {
          CardID: contisAccountDetails.cardId,
          CardStatus: 5,
        },
      ],
    })
    await contisCardProviderFacade.setCardAsLostWithReplacement(contisAccountDetails)

    expect(contisUpdateHandler.setCardAsLostWithReplacement).toBeCalledWith(
      contisAccountDetails.cardId,
      contisAccountDetails.consumerId,
    )
  })

  it('should call setCardAsDamaged', async () => {
    const newCardId = 2
    jest.spyOn(contisUpdateHandler, 'setCardAsDamaged')
    jest.spyOn(contisQueryHandler, 'listCards').mockResolvedValue({
      CardResList: [
        {
          CardID: newCardId,
          CardStatus: INACTIVE_CARD_STATUS,
        },
        {
          CardID: contisAccountDetails.cardId,
          CardStatus: 5,
        },
      ],
    })

    await contisCardProviderFacade.setCardAsDamaged(contisAccountDetails)

    expect(contisUpdateHandler.setCardAsDamaged).toBeCalledWith(contisAccountDetails.cardId, contisAccountDetails.consumerId)
  })
})
