import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class Manifest extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public manifestNumber: string;

  @column()
  public importedBy: number;

  @column.dateTime()
  public manifestDate: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
