import { EntityManager } from 'typeorm'

import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { ConfigSourceFactory } from '../../src/shared-components/providers'
import { getEpicurusInstance } from '../../src/shared-components/providers/redis/EpicurusClient'
import { EpicurusPublicInterface } from 'epicurus-node'
import { CardOrderRequestRepository } from '../../src/shared-components/repositories/CardOrderRequestRepository'
import { RedisConfig, CardOrderRequestStatus, CardOrderRequest } from '../../src/shared-components/models'
import { defaultTestUser, kycStatusChangeChannel, cardCurrency, presentAddress } from '../utils/test-data'
import { dbChangeRecorded } from '../utils/waiting-utils'
import { CardOrderKycCheckQueue } from '../../src/app/card-order/CardOrderKycCheckQueue'

describe('CardOrderKycCheckQueue', () => {
  let app
  let moduleFixture
  let cardOrderKycCheckQueue: CardOrderKycCheckQueue
  let cardOrderRequestRepository: CardOrderRequestRepository
  let epicurus: EpicurusPublicInterface
  let redisConfig: RedisConfig
  let entityManager: EntityManager

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardOrderKycCheckQueue = appAndFixture.moduleFixture.get<CardOrderKycCheckQueue>(CardOrderKycCheckQueue)
    cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    redisConfig = ConfigSourceFactory.getConfigSourceForEnvironment().getRedisConfig()
  })

  afterEach(async () => await cleanDatabase())

  // tslint:disable-next-line:max-line-length
  it('recordKycCheckChange - should use set status order request status to kyc_verified when approved event emitted', async () => {
    const orderRequest = await cardOrderRequestRepository.saveCardOrderRequest(
      defaultTestUser.id,
      cardCurrency,
      CardOrderRequestStatus.kycPending,
      presentAddress,
      entityManager,
    )

    epicurus = getEpicurusInstance(redisConfig)
    await epicurus.publish(kycStatusChangeChannel, {
      accountId: defaultTestUser.id,
      event: 'approved',
    })

    const changeRecoded = await checkForCardOrderRequestStatusChange(
      orderRequest,
      entityManager,
      CardOrderRequestStatus.kycVerified,
    )
    expect(changeRecoded).toBeTruthy()
  })

  /* tslint:disable-next-line:max-line-length */
  it('recordKycCheckChange - should use set status order request status to kyc-rejected when rejected event emitted', async () => {
    const orderRequest = await cardOrderRequestRepository.saveCardOrderRequest(
      defaultTestUser.id,
      cardCurrency,
      CardOrderRequestStatus.kycPending,
      presentAddress,
    )
    epicurus = getEpicurusInstance(redisConfig)
    await epicurus.publish(kycStatusChangeChannel, {
      accountId: defaultTestUser.id,
      event: 'rejected',
    })

    const changeRecoded = await checkForCardOrderRequestStatusChange(
      orderRequest,
      entityManager,
      CardOrderRequestStatus.kycRejected,
    )
    expect(changeRecoded).toBeTruthy()
  })

  /* tslint:disable-next-line:max-line-length */
  it('triggerCardOrderForVerifiedUsers - should update all order requests statuses from verified to completed', async () => {
    const request = await cardOrderRequestRepository.saveCardOrderRequest(
      defaultTestUser.id,
      cardCurrency,
      CardOrderRequestStatus.kycVerified,
      presentAddress,
    )

    // Simulating multiple instances of the debit card service running simultaneously
    // Making sure a single card is ordered
    await Promise.all([
      cardOrderKycCheckQueue.triggerCardOrderForVerifiedUsers(),
      cardOrderKycCheckQueue.triggerCardOrderForVerifiedUsers(),
    ])

    const requestAfterTrigger = await cardOrderRequestRepository.findOne(request.id)

    expect(requestAfterTrigger!.status).toEqual(CardOrderRequestStatus.completed)
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})

export const checkForCardOrderRequestStatusChange = (
  orderRequest: CardOrderRequest,
  entityManager: EntityManager,
  status: CardOrderRequestStatus,
) =>
  dbChangeRecorded(async () => {
    const request = await entityManager.findOne(CardOrderRequest, orderRequest.id)

    return Promise.resolve(!!request && request.status === status)
  })
