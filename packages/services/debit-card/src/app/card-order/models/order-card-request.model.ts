import { CurrencyCode, Address } from '../../../shared-components/models'
import { ApiModelProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsIn } from 'class-validator'

export class OrderCardRequest {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsIn(Object.values(CurrencyCode))
  cardCurrency: CurrencyCode

  @ApiModelProperty()
  @IsNotEmpty()
  presentAddress: Address
}
