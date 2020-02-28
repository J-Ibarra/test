import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CardRepository } from '../../../../shared-components/repositories'
import { StatusChangeRecorder } from '../StatusChangeRecorder'
import { DebitCardStatus } from '../../../../shared-components/models/card/DebitCardStatus.enum'

const cardRepository = {
  updateCardStatus: jest.fn(),
}

const consumerId = 1
const statusDeclined = '07'

describe('StatusChangeRecorder', () => {
  let statusChangeRecorder: StatusChangeRecorder

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StatusChangeRecorder,
        {
          provide: getRepositoryToken(CardRepository),
          useValue: cardRepository,
        },
      ],
    }).compile()

    statusChangeRecorder = module.get<StatusChangeRecorder>(StatusChangeRecorder)
  })

  it('should update debit card with status declined', async () => {
    jest.spyOn(cardRepository, 'updateCardStatus').mockImplementation(() => Promise.resolve())

    await statusChangeRecorder.updateUserStatusChange({
      CardHolderID: consumerId,
      NewStatus: statusDeclined,
    } as any)
    await expect(cardRepository.updateCardStatus).toHaveBeenCalledWith({ consumerId }, DebitCardStatus.declined)
  })
})
