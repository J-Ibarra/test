import { DebitCardStatus } from '../../../shared-components/models'
import { IsString, IsNotEmpty } from 'class-validator'

export class CardStatusChangeRequest {
  @IsString()
  email: string

  @IsNotEmpty()
  status: DebitCardStatus
}
