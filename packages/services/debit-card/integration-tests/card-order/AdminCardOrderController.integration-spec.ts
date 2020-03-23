import request from 'supertest'
import { setUp, tearDown } from '../utils/before-each.util'
import { CardOrderRequestRepository } from '../../src/shared-components/repositories/CardOrderRequestRepository'
import { CardOrderRequestStatus, CardOrderRequest } from '../../src/shared-components/models'
import { defaultTestUser, cardCurrency, presentAddress } from '../utils/test-data'

describe('AdminCardOrderController:integration', () => {
  let app
  let moduleFixture
  let cardOrderRequestRepository: CardOrderRequestRepository

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
    await cardOrderRequestRepository.saveCardOrderRequest(
      defaultTestUser.accountId,
      cardCurrency,
      CardOrderRequestStatus.orderFailed,
      presentAddress,
    )
  })

  it('should set card order request to adminApplicationAllowed', async () => {
    return request(app.getHttpServer())
      .post('/api/debit-cards/admin/order/second-attempt')
      .send({ accountId: defaultTestUser.accountId })
      .expect(200)
      .then(async () => {
        const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.getLatestOrderRequestForAccount(
          defaultTestUser.accountId,
        )

        expect(cardOrderRequest.status).toEqual(CardOrderRequestStatus.adminApplicationAllowed)
      })
  })

  afterEach(async () => await tearDown(app, moduleFixture))
})
