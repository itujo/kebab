import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Transporters extends BaseSchema {
  protected tableName = 'transporters';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('address').notNullable();
      table.string('document').notNullable().unique();
      table.string('brd_user').notNullable();
      table.string('brd_pwd').notNullable();
      table.string('api_token').notNullable();
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
