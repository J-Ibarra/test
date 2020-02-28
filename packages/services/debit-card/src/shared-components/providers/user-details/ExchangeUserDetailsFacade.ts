import { Injectable, Inject } from '@nestjs/common'

import { UserDetailsFacade } from './UserDetailsFacade'
import { CompleteAccountDetails } from '../../models'
import { getEpicurusInstance } from '../redis/EpicurusClient'
import { ConfigSource, CONFIG_SOURCE_TOKEN } from '../config'

const accountRequestChannel = 'datasetRetrieval:extendedUserDetails'

@Injectable()
export class ExchangeUserDetailsFacade implements UserDetailsFacade {
  constructor(
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
  ) {}

  public getFullAccountDetails(
    accountId: string,
  ): Promise<CompleteAccountDetails> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    return epicurus.request(accountRequestChannel, {
      accountId,
    })
  }
}
