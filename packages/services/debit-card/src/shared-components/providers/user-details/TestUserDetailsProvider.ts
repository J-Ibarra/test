import { User, AccountType } from '@abx/ke-auth-lib'

export const defaultTestUser: User = {
  id: '12',
  accountType: AccountType.individual,
  accountId: '12',
  firstName: 'James',
  lastName: 'Williams',
  email: 'james.williams@foo.bar',
}

export class TestUserDetailsProvider {
  constructor(private user: User = defaultTestUser) {}

  getUserDetails(): User {
    return this.user
  }
}
