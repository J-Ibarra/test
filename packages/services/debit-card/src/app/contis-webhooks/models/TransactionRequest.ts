import { IsNotEmpty, IsInt } from 'class-validator'
import { ApiModelProperty } from '@nestjs/swagger'

export class TransactionRequest {
  @ApiModelProperty()
  @IsInt()
  CardID: number

  @ApiModelProperty()
  @IsNotEmpty()
  TransactionType: string

  @ApiModelProperty()
  @IsNotEmpty()
  Description: string

  @ApiModelProperty()
  @IsInt()
  AuthoriseAmount: number

  @ApiModelProperty()
  @IsInt()
  TransactionID: number
}
