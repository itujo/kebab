import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Transporters extends BaseSchema {
  protected tableName = 'transporters';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('address').notNullable();
      table.string('document').notNullable().unique();
      table.string('brdUser');
      table.string('brdPwd');
      table.string('apiToken');
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
