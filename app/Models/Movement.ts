import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class Movement extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public minuta: string;

  @column()
  public nf: string;

  @column.dateTime()
  public dataEmissao: DateTime;

  @column()
  public obs: string;

  @column()
  public recebedor: string;

  @column.dateTime()
  public dataRecebimento: DateTime;

  @column()
  public senderId: number;

  @column()
  public transporterId: number;

  @column()
  public closed: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}

export type MovementCsvRow = {
  minuta: string;
  data: string;
  notas: string;
  cliente: string;
  cnpjCliente: string;
  remetente: string;
  cnpjRemetente: string;
  destinatario: string;
  cnpjDestinatario: string;
  totalFrete: string;
  obs?: string;
};
