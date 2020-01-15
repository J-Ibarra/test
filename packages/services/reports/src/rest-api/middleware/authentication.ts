import { expressAuthentication as authenticate } from '@abx/express-middleware'
import { OverloadedRequest } from '@abx-types/account'

export async function expressAuthentication(request: OverloadedRequest, securityName: string, args: string[]) {
  return authenticate(request, securityName, args)
}
б
