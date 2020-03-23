import { Module } from '@nestjs/common'

import { ENCRYPTION_SERVICE, AESEncryptionService, CONTIS_AXIOS_INSTANCE_TOKEN } from '../../shared-components/providers'
import { contisAxiosInstanceFactory } from '../TopLevelProviders'
import { CardNumberValidatorController } from './CardNumberValidatorController'
import { CardNumberValidator } from './CardNumberValidator'
import { commonProviders } from '../common-dependencies'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContisRequestLogRepository, CardRepository, CardActivationAttemptRepository } from '../../shared-components/repositories'
import { CardActivationAttemptValidator } from './CardActivationAttemptValidatior'

@Module({
  imports: [TypeOrmModule.forFeature([CardRepository, CardActivationAttemptRepository, ContisRequestLogRepository])],
  providers: [
    ...commonProviders,
    {
      provide: ENCRYPTION_SERVICE,
      useClass: AESEncryptionService,
    },
    {
      provide: CONTIS_AXIOS_INSTANCE_TOKEN,
      useFactory: contisAxiosInstanceFactory,
    },
    CardNumberValidator,
    CardActivationAttemptValidator,
  ],
  controllers: [CardNumberValidatorController],
})
export class CardNumberValidatorModule {}
