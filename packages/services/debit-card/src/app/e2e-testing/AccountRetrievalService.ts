import { Inject, Injectable } from '@nestjs/common'
import { CONFIG_SOURCE_TOKEN, ConfigSource } from '../../shared-components/providers'
import { getEpicurusInstance } from '../../shared-components/providers/redis/EpicurusClient'

const accountRequestChannel = 'datasetRetrieval:getAccountDetailsByEmail'

@Injectable()
export class AccountRetrievalService {
  constructor(@Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource) {}

  async findAccountIdForEmail(email: string): Promise<string> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    const account = await epicurus.request(accountRequestChannel, {
      email,
    })

    return account.id
  }
}
