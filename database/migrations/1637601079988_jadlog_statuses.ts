import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class JadlogStatuses extends BaseSchema {
  protected tableName = 'jadlog_statuses';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      table.string('description_jadlog').notNullable();

      table.integer('status_brudam_id').unsigned().nullable();

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
