import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

import { DEBIT_CARD_TABLE, TRANSACTION_TABLE } from '../shared-components/models'

export class TransactionCreation1515769694450 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: TRANSACTION_TABLE,
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'amount',
            type: 'numeric',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['incoming', 'outgoing'],
          },
          {
            name: 'debit_card_id',
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

    await queryRunner.createForeignKey(
      TRANSACTION_TABLE,
      new TableForeignKey({
        columnNames: ['debit_card_id'],
        referencedColumnNames: ['id'],
        referencedTableName: DEBIT_CARD_TABLE,
        onDelete: 'CASCADE',
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    const table = await queryRunner.getTable(TRANSACTION_TABLE)
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('debit_card_id') !== -1) || ''
      await queryRunner.dropForeignKey(DEBIT_CARD_TABLE, foreignKey)
      await queryRunner.dropColumn(TRANSACTION_TABLE, 'debit_card_id')
      await queryRunner.dropTable(TRANSACTION_TABLE)
    }
  }
}
