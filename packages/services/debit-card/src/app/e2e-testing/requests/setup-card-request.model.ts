import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

import {
  CurrencyCode,
  DebitCardProvider,
  Transaction,
  DebitCardStatus,
  CardOrderRequestStatus,
} from '../../../shared-components/models'

export class SetupCardRequest {
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsIn(Object.values(CurrencyCode))
  currency: CurrencyCode

  @IsNotEmpty()
  provider: DebitCardProvider

  @IsNotEmpty()
  @IsNumber()
  balance: number

  @IsOptional()
  transactions: CardSetupRequestTransaction[]

  @IsOptional()
  status: DebitCardStatus
}

export class SetupCardOrderRequest {
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsIn(Object.values(CurrencyCode))
  currency: CurrencyCode

  @IsOptional()
  status: CardOrderRequestStatus
}

export type CardSetupRequestTransaction = Pick<Transaction, 'amount' | 'type' | 'description' | 'metadata'>
