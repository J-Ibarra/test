import { MigrationInterface, QueryRunner, TableColumn, Table } from 'typeorm'

import { TRANSACTION_TABLE, CARD_CONSTRAINT_TABLE } from '../shared-components/models'

export class TransactionTableChanges1617769699999 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(TRANSACTION_TABLE, 'fee')
    await queryRunner.addColumn(
      TRANSACTION_TABLE,
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    )

    await queryRunner.createTable(
      new Table({
        name: 'card_activation_attempt',
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'attempts',
            type: 'numeric',
          },
          {
            name: 'card_id',
            type: 'int',
            isNullable: false,
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

    await queryRunner.query(`ALTER TABLE ${CARD_CONSTRAINT_TABLE} ALTER COLUMN value TYPE character varying(255)`)
    await queryRunner.query(`INSERT INTO ${CARD_CONSTRAINT_TABLE} VALUES (4, 'balanceLimit', '{ "EUR": 8000, "GBP":  7700 }')`)
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(TRANSACTION_TABLE, 'fee')
  }
}
