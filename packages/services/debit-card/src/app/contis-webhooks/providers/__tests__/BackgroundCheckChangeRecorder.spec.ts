import { Test } from '@nestjs/testing'
import { BackgroundCheckStatusChangeRecorder } from '../BackgroundCheckChangeRecorder'
import { CardRepository } from '../../../../shared-components/repositories'
import { DebitCardStatus } from '../../../../shared-components/models'

const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  updateCardStatus: jest.fn(),
}

describe('CardLockingService', () => {
  let backgroundCheckChangeRecorder: BackgroundCheckStatusChangeRecorder
  const consumerId = 12

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BackgroundCheckStatusChangeRecorder,
        {
          provide: CardRepository,
          useValue: cardRepository,
        },
      ],
    }).compile()

    backgroundCheckChangeRecorder = module.get<BackgroundCheckStatusChangeRecorder>(BackgroundCheckStatusChangeRecorder)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('recordHoscCheckChange', () => {
    it('should update card status to hoscCheckFailure when hoscStatus is 04', async () => {
      await backgroundCheckChangeRecorder.recordHoscCheckChange({ CardHolderId: consumerId, HOSCStatus: '04' } as any)

      expect(cardRepository.updateCardStatus).toHaveBeenCalledWith({ consumerId }, DebitCardStatus.hoscCheckFailure)
    })

    it('should not update card status to hoscCheckFailure when hoscStatus is 02', async () => {
      await backgroundCheckChangeRecorder.recordHoscCheckChange({ CardHolderId: consumerId, HOSCStatus: '02' } as any)

      expect(cardRepository.updateCardStatus).toHaveBeenCalledWith({ consumerId }, DebitCardStatus.hoscCheckFailure)
    })
  })

  describe('recordHoscCheckChange', () => {
    it('should update card status to greylistCheckFailure when greyAreaStatus is 1', async () => {
      await backgroundCheckChangeRecorder.recordGreylistCheckChange({
        CardHolderId: consumerId,
        IsGreyAreaPostcode: 1,
      } as any)

      expect(cardRepository.updateCardStatus).toHaveBeenCalledWith({ consumerId }, DebitCardStatus.greylistCheckFailure)
    })

    it('should not update card status to greylistCheckFailure when greyAreaStatus is 0', async () => {
      await backgroundCheckChangeRecorder.recordGreylistCheckChange({
        CardHolderId: consumerId,
        IsGreyAreaPostcode: 0,
      } as any)

      expect(cardRepository.updateCardStatus).toBeCalledTimes(0)
    })
  })
})
