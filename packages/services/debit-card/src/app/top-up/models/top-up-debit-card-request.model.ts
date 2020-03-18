import { KinesisCryptoCurrency } from '../../../shared-components/models'
import { IsIn, IsNotEmpty, IsNumber } from 'class-validator'
import { ApiModelProperty } from '@nestjs/swagger'

export class TopUpDebitCardRequest {
  @ApiModelProperty()
  @IsNumber()
  amount: number

  @ApiModelProperty()
  @IsNotEmpty()
  @IsIn(Object.values(KinesisCryptoCurrency))
  currency: KinesisCryptoCurrency
}
