import { ApiModelProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CardNumberValidatorRequest {
  @ApiModelProperty()
  @IsNotEmpty({ message: 'The last four digits argument needs to be present' })
  lastFourDigits: string

  @ApiModelProperty()
  @IsNotEmpty({ message: 'Please submit a valid card CVV number' })
  cvv: string

  @ApiModelProperty()
  @IsNotEmpty({ message: 'Please submit your date of birth' })
  dateOfBirth: string
}
