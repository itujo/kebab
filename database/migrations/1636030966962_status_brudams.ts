import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class StatusBrudams extends BaseSchema {
  protected tableName = 'status_brudams';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.string('description_brd').notNullable().unique();

      table.integer('id_brd').unique().notNullable();

      table
        .integer('status_id')
        .unsigned()
        .nullable()
        .references('statuses.id')
        .onDelete('CASCADE');
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
