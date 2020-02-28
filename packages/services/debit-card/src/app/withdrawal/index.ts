import { Module } from '@nestjs/common'

import { WithdrawalController } from './WithdrawalController'
import { WithdrawalExternalGateway } from './WithdrawalExternalGateway'
import { WithdrawalOrchestrator } from './WithdrawalOrchestrator'
import {
  BALANCE_RESERVE_FACADE_TOKEN,
  balanceReserveFactory,
  CardConstraintService,
  BalanceSourceOfTruthComparator,
} from '../../shared-components/providers'
import { commonProviders } from '../common-dependencies'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
  CardRepository,
  ContisRequestLogRepository,
  TransactionRepository,
  CardConstraintRepository,
} from '../../shared-components/repositories'

@Module({
  imports: [
    TypeOrmModule.forFeature([CardRepository, ContisRequestLogRepository, TransactionRepository, CardConstraintRepository]),
  ],
  providers: [
    {
      provide: BALANCE_RESERVE_FACADE_TOKEN,
      useFactory: balanceReserveFactory,
    },
    WithdrawalExternalGateway,
    WithdrawalOrchestrator,
    ...commonProviders,
    CardConstraintService,
    BalanceSourceOfTruthComparator,
  ],
  controllers: [WithdrawalController],
})
export class WithdrawalModule {}
