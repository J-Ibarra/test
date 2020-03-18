import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import { CARD_ORDER_REQUEST_TABLE } from '../shared-components/models'

export class CardOrderRequestTableCreation1515769694449 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: CARD_ORDER_REQUEST_TABLE,
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'account_id',
            type: 'text',
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['EUR', 'GBP'],
          },
          {
            name: 'initial_deposit',
            type: 'numeric',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(CARD_ORDER_REQUEST_TABLE)
  }
}
