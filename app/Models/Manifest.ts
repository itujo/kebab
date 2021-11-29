import { DateTime } from 'luxon';
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Transporter from './Transporter';

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

  @column()
  public transporterId: number;

  @belongsTo(() => Transporter)
  public transporter: BelongsTo<typeof Transporter>;
}
