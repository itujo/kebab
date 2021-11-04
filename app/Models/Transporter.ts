import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class Transporter extends BaseModel {
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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
