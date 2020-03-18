import { Test } from '@nestjs/testing'
import { User, AccountType } from '@abx/ke-auth-lib'
import { RequestValidationAdapter } from '../RequestValidationAdapter'
import { CONFIG_SOURCE_TOKEN } from '../../../shared-components/providers'
import { LocalTestConfigSource } from '../../../shared-components/providers/config/source'

const testUser: User = {
  id: '12',
  accountType: AccountType.individual,
  accountId: '12',
  firstName: 'James',
  lastName: 'Williams',
  email: 'james.williams@foo.bar',
}

describe('RequestValidationAdapter', () => {
  let requestValidationAdapter: RequestValidationAdapter

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RequestValidationAdapter,
        {
          provide: CONFIG_SOURCE_TOKEN,
          useClass: LocalTestConfigSource,
        },
      ],
    }).compile()

    requestValidationAdapter = module.get<RequestValidationAdapter>(
      RequestValidationAdapter,
    )
  })

  it('should use authGuard to enrich request with user details and return details if user exists', async () => {
    const request = {
      foo: 'bar',
    }
    jest.spyOn(requestValidationAdapter.authGuard, 'enrichRequestWithUserDetails').mockReturnValue(
      Promise.resolve({
        user: testUser,
      }) as any,
    )

    const requestUser = await requestValidationAdapter.validateRequest(
      request as any,
    )

    expect(requestValidationAdapter.authGuard.enrichRequestWithUserDetails).toHaveBeenCalledWith(request)
    expect(requestUser).toEqual(testUser)
  })

  it('should use authGuard to enrich request with user details and null if user does not exist', async () => {
    const request = {
      foo: 'bar',
    }
    jest.spyOn(requestValidationAdapter.authGuard, 'enrichRequestWithUserDetails').mockReturnValue(
      Promise.resolve(request) as any,
    )

    const requestUser = await requestValidationAdapter.validateRequest(
      request as any,
    )

    expect(requestValidationAdapter.authGuard.enrichRequestWithUserDetails).toHaveBeenCalledWith(request)
    expect(requestUser).toEqual(null)
  })
})
