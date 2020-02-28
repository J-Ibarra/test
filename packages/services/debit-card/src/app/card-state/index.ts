import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CardStateService } from './CardStateService'
import { CardStateController } from './CardStateController'
import { commonProviders } from '../common-dependencies'
import { ContisRequestLogRepository, CardRepository } from '../../shared-components/repositories'

@Module({
  imports: [TypeOrmModule.forFeature([ContisRequestLogRepository, CardRepository])],
  providers: [CardStateService, ...commonProviders],
  controllers: [CardStateController],
})
export class CardStateModule {}
