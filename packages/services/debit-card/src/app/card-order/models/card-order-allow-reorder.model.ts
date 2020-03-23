import { IsNotEmpty } from 'class-validator'
import { ApiModelProperty } from '@nestjs/swagger'

export class AllowAnotherApplicationForAccountRequest {
  @ApiModelProperty()
  @IsNotEmpty()
  accountId: string
}
