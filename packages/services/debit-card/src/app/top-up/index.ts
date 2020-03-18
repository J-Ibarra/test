import { Module } from '@nestjs/common'

import { TopUpController } from './TopUpController'
import { TopUpRecorder } from './TopUpRecorder'
import { commonProviders } from '../common-dependencies'
import {
  BALANCE_RESERVE_FACADE_TOKEN,
  balanceReserveFactory,
  CardConstraintService,
  ExchangeOrderPlacementFacade,
  PLACE_ORDER_FACADE_TOKEN,
  BalanceSourceOfTruthComparator,
} from '../../shared-components/providers'
import { TopUpTracker } from './TopUpTracker'
import { TopUpExecutor } from './TopUpExecutor'
import { TopUpBalanceReserver } from './request-dispatcher/TopUpBalanceReserver'
import { TopUpRequestDispatcher } from './request-dispatcher/TopUpRequestDispatcher'
import { TopUpSuccessRecorder } from './request-dispatcher/TopUpSuccessRecorder'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
  ContisRequestLogRepository,
  CardConstraintRepository,
  CardRepository,
  TopUpRequestRepository,
  TransactionRepository,
} from '../../shared-components/repositories'
import { BalanceReserverRetryHandler } from './retry-handlers/BalanceReserveRetryHandler'
import { TopUpProviderRequestRetryHandler } from './retry-handlers/TopUpProviderRequestRetryHandler'
import { TopUpBalanceLimitChecker } from './request-dispatcher/TopUpBalanceLimitChecker'

@Module({
  imports: [
    TypeOrmModule.forFeature([ContisRequestLogRepository, TopUpRequestRepository, CardConstraintRepository, CardRepository, TransactionRepository]),
  ],
  providers: [
    {
      provide: BALANCE_RESERVE_FACADE_TOKEN,
      useFactory: balanceReserveFactory,
    },
    {
      provide: PLACE_ORDER_FACADE_TOKEN,
      useValue: new ExchangeOrderPlacementFacade(),
    },
    TopUpRecorder,
    TopUpTracker,
    TopUpExecutor,
    TopUpBalanceReserver,
    TopUpRequestDispatcher,
    TopUpSuccessRecorder,
    CardConstraintService,
    ExchangeOrderPlacementFacade,
    BalanceSourceOfTruthComparator,
    BalanceReserverRetryHandler,
    TopUpProviderRequestRetryHandler,
    TopUpBalanceLimitChecker,
    ...commonProviders,
  ],
  controllers: [TopUpController],
})
export class TopUpModule {}
