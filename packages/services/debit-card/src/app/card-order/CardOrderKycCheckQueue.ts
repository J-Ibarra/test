import { OnModuleInit, Injectable, Inject, Logger } from '@nestjs/common'
import { TransactionManager, EntityManager } from 'typeorm'
import {
  ConfigSource,
  CONFIG_SOURCE_TOKEN,
  ExchangeUserDetailsFacade,
  USER_DETAILS_FACADE_TOKEN,
} from '../../shared-components/providers'
import { getEpicurusInstance } from '../../shared-components/providers/redis/EpicurusClient'
import { CardOrderRequestRepository } from '../../shared-components/repositories/CardOrderRequestRepository'
import { CardOrderRequestStatus, CardOrderRequest } from '../../shared-components/models'
import { CardOrderOrchestrator } from './CardOrderOrchestrator'

const kycStatusChangeChannel = 'exchange:account:kycStatusChange'
const FIVE_MINUTES_IN_MILLIS = 5 * 60 * 1000

@Injectable()
export class CardOrderKycCheckQueue implements OnModuleInit {
  private logger = new Logger('CardOrderKycCheckQueue')

  constructor(
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
    @TransactionManager()
    private entityManager: EntityManager,
    private cardOrderRequestRepository: CardOrderRequestRepository,
    @Inject(USER_DETAILS_FACADE_TOKEN)
    private userDetailsFacade: ExchangeUserDetailsFacade,
    private cardOrderOrchestrator: CardOrderOrchestrator,
  ) {}

  onModuleInit() {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    epicurus.subscribe(kycStatusChangeChannel, async message => {
      try {
        await this.recordKycCheckChange(message.accountId, message.event)
      } catch (e) {
        this.logger.error(JSON.stringify(e))
      }
    })

    setInterval(() => {
      this.triggerCardOrderForVerifiedUsers()
    }, Number(process.env.DEBIT_CARD_KYC_CHECK_INTERVAL || FIVE_MINUTES_IN_MILLIS))
  }

  public triggerCardOrderForVerifiedUsers(): Promise<void> {
    return this.entityManager.transaction(async manager => {
      this.logger.debug('Checking for recently KYC verified card requests')
      const requests: CardOrderRequest[] = await this.cardOrderRequestRepository.getOrderRequestsByStatus(
        CardOrderRequestStatus.kycVerified,
        manager,
        true,
      )

      this.logger.debug(`${requests.length} requests found`)
      await Promise.all(requests.map(orderRequest => this.orderCardForVerifiedRequest(orderRequest, manager)))
    })
  }

  public recordKycCheckChange(accountId: string, status: 'approved' | 'rejected'): Promise<void> {
    return this.entityManager.transaction(async manager => {
      const request = await this.cardOrderRequestRepository.getLatestOrderRequestForAccount(accountId, manager, true)

      if (request.status === CardOrderRequestStatus.kycVerified || request.status === CardOrderRequestStatus.kycRejected) {
        return
      }

      this.logger.log(`${status} kyc status update received for ${request.accountId}`)
      await this.cardOrderRequestRepository.updateOrderRequestStatus(
        request.accountId,
        request.currency,
        status === 'approved' ? CardOrderRequestStatus.kycVerified : CardOrderRequestStatus.kycRejected,
        manager,
      )
    })
  }

  private async orderCardForVerifiedRequest(request: CardOrderRequest, manager: EntityManager): Promise<void> {
    const { accountId, currency, presentAddress } = request

    const account = await this.userDetailsFacade.getFullAccountDetails(accountId)

    return this.cardOrderOrchestrator.orderDebitCardForUser(account, currency, presentAddress, manager)
  }
}
