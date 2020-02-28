import { IsNumber } from 'class-validator'
import { ApiModelProperty } from '@nestjs/swagger'

export class WithdrawalRequest {
  @ApiModelProperty()
  @IsNumber()
  amount: number
}
