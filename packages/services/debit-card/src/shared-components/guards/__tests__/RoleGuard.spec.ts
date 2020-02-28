import { User, AccountType } from '@abx/ke-auth-lib'
import { RolesGuard } from '../RolesGuard'

const testUser: User = {
  id: '12',
  accountType: AccountType.individual,
  accountId: '12',
  firstName: 'James',
  lastName: 'Williams',
  email: 'james.williams@foo.bar',
}

describe('RolesGuard', () => {
  const reflectorGetMock = jest.fn()
  const validateRequestMock = jest.fn()
  const rolesGuard = new RolesGuard(
    {
      get: reflectorGetMock,
    } as any,
    {
      validateRequest: validateRequestMock,
    } as any,
  )

  it('should return true if no roles defined on the handler', async () => {
    const getHandler = () => jest.fn()
    const canActivate = await rolesGuard.canActivate({
      getHandler,
    } as any)

    expect(reflectorGetMock.mock.calls[0][0]).toEqual('roles')
    expect(canActivate).toBeTruthy()
  })

  describe('roles defined on handler endpoint', () => {
    const executionContextMock = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          raw: {
            headers: {},
          },
        }),
      }),
    }
    const allowedRoles = ['admin']

    it('should return false if no user found by requestValidationAdapter', async () => {
      reflectorGetMock.mockReturnValue(allowedRoles)
      validateRequestMock.mockReturnValue(Promise.resolve(null))

      const canActivate = await rolesGuard.canActivate(
        executionContextMock as any,
      )

      expect(canActivate).toBeFalsy()
    })

    it('should return false if user doesnt have required account type', async () => {
      reflectorGetMock.mockReturnValue(allowedRoles)
      validateRequestMock.mockReturnValue(Promise.resolve(testUser))

      const canActivate = await rolesGuard.canActivate(
        executionContextMock as any,
      )

      expect(canActivate).toBeFalsy()
    })

    it('should return true if user has required account type', async () => {
      reflectorGetMock.mockReturnValue(allowedRoles)
      validateRequestMock.mockReturnValue(
        Promise.resolve({ testUser, accountType: AccountType.individual }),
      )

      const canActivate = await rolesGuard.canActivate(
        executionContextMock as any,
      )

      expect(canActivate).toBeFalsy()
    })
  })
})
