import { CreateAccountRequest } from '../account/CreateAccountRequest.interface'

export interface CreateUserRequest extends CreateAccountRequest {
  accountId: string
}
