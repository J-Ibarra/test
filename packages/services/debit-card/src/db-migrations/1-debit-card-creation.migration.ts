import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import { DEBIT_CARD_TABLE } from '../shared-components/models'

export class DebitCardTableCreation1515769694449 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: DEBIT_CARD_TABLE,
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
            name: 'provider',
            type: 'enum',
            enum: ['contis'],
          },
          {
            name: 'provider_account_details',
            type: 'jsonb',
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['EUR', 'GBP'],
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
    await queryRunner.dropTable(DEBIT_CARD_TABLE)
  }
}
