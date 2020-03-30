import { OnModuleInit, Injectable, Inject, Logger } from '@nestjs/common'
import util from 'util'

import {
  ConfigSource,
  CONFIG_SOURCE_TOKEN,
} from '../../shared-components/providers'
import { getEpicurusInstance } from '../../shared-components/providers/redis/EpicurusClient'
import { TopUpExecutor } from './TopUpExecutor'
import { TopUpRequestRepository } from '../../shared-components/repositories'
import { EntityManager, TransactionManager } from 'typeorm'

export const orderExecutionResultDispatched =
  'contractExchange:orderExecutionResultDispatched'

interface OrderExecutionUpdate {
  accountId: string
  orderId: number
  amountReceived: number
  amountFilled: number
}

@Injectable()
export class TopUpTracker implements OnModuleInit {
  private logger = new Logger('TopUpTracker')

  constructor(
    @TransactionManager()
    private readonly entityManager: EntityManager,
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
    private topUpExecutor: TopUpExecutor,
    private topUpRequestRepository: TopUpRequestRepository,
  ) {}

  onModuleInit() {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    epicurus.subscribe(
      orderExecutionResultDispatched,
      async ({
        orderId,
        accountId,
        amountReceived,
        amountFilled,
      }: OrderExecutionUpdate) => {
        const topUpRequest = await this.topUpRequestRepository.getTopUpRequestByOrderId(
          orderId,
          this.entityManager,
        )
        if (!!topUpRequest) {
          this.logger.debug(
            `Received order execution update for order ${orderId}, account ${accountId} and top up request ${
              topUpRequest.id
            }`,
          )

          try {
            this.recordOrderUpdate(
              topUpRequest.id,
              accountId,
              orderId,
              amountFilled,
              amountReceived,
            )
          } catch (e) {
            this.logger.error(JSON.stringify(util.inspect(e)))
          }
        }
      },
    )
  }

  async recordOrderUpdate(
    topUpRequestId: number,
    accountId: string,
    orderId: number,
    amountFilled: number,
    amountToTopUp: number,
  ) {
    await this.topUpRequestRepository.updateTopUpRequestByOrderId(orderId, {
      amountFilled,
    })

    await this.topUpExecutor.executeTopUp(
      topUpRequestId,
      accountId,
      amountToTopUp,
    )
  }
}
