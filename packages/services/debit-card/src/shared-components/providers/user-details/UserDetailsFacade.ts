import { CompleteAccountDetails } from '../../models';

export const USER_DETAILS_FACADE_TOKEN = 'user_details_facade'

/** Defines the mechanism for retrieving {@link CompleteAccountDetails}.  */
export interface UserDetailsFacade {
  getFullAccountDetails(accountId: string): Promise<CompleteAccountDetails>
}
