import { UserDetailsFacade } from './UserDetailsFacade'
import { CompleteAccountDetails } from '../../models'

export class UserDetailsFacadeStub implements UserDetailsFacade {
  constructor(private accountDetails: CompleteAccountDetails) {}

  public getFullAccountDetails(): Promise<CompleteAccountDetails> {
    return Promise.resolve(this.accountDetails)
  }
}
