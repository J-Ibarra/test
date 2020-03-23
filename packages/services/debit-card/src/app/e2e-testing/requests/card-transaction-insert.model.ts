import { IsNotEmpty, IsOptional } from 'class-validator'
import { CardSetupRequestTransaction } from './setup-card-request.model'

export class CardTransactionInsertRequest {
  @IsNotEmpty()
  email: string

  @IsOptional()
  transactions: CardSetupRequestTransaction[]
}
