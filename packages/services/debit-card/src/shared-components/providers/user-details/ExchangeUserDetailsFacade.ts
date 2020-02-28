import { Injectable } from '@nestjs/common'

import { UserDetailsFacade } from './UserDetailsFacade'
import { CompleteAccountDetails } from '../../models'
import { getKycVerifiedAccountDetails } from '@abx-service-clients/account'

@Injectable()
export class ExchangeUserDetailsFacade implements UserDetailsFacade {
  public getFullAccountDetails(accountId: string): Promise<CompleteAccountDetails> {
    return (getKycVerifiedAccountDetails(accountId) as unknown) as Promise<CompleteAccountDetails>
  }
}
