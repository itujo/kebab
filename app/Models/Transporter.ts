import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';
import Movement from './Movement';

export default class Sender extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public name: string;

  @column()
  public address: string;

  @column()
  public document: string;

  @column()
  public brdUser: string;

  @column()
  public brdPwd: string;

  @column()
  public apiToken: string;

  @hasMany(() => Movement)
  public movements: HasMany<typeof Movement>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
