import { Entity, Column } from 'typeorm'

import { BaseEntity } from '../BaseEntity.entity'
import { ContisRequestPayload } from '../../providers/debit-card-provider/contis/requests/ContisRequestPayload'
import { ContisEndpointPath } from '../../providers'

export const CONTIS_REQUEST_LOG_TABLE = 'contis_request_log'

@Entity(CONTIS_REQUEST_LOG_TABLE)
export class ContisRequestLog extends BaseEntity {
  @Column({
    name: 'endpoint',
    type: 'varchar',
  })
  endpoint: ContisEndpointPath

  @Column({ name: 'payload', type: 'jsonb' })
  payload: ContisRequestPayload

  constructor(endpoint: ContisEndpointPath, payload: ContisRequestPayload) {
    super()
    this.endpoint = endpoint
    this.payload = payload
  }
}
