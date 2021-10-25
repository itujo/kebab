import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Movement, { MovementCsvRow } from 'App/Models/Movement';
import Sender from 'App/Models/Sender';
import parse from 'csv-parse';
import { createReadStream } from 'fs';
import { DateTime } from 'luxon';
export default class MovementsController {
  public async import({ request, response }: HttpContextContract) {
    const transporterId = request.param('transporterId');
    const file = request.file('file', {
      extnames: ['csv'],
    });

    if (!file?.isValid) {
      return file?.errors;
    }

    if (file) {
      try {
        await file?.move(Application.tmpPath('uploads'), {
          overwrite: false,
        });

        const csvData: MovementCsvRow[] = [];

        createReadStream(file.filePath!)
          .pipe(
            parse({
              delimiter: ';',
              columns: [
                'minuta',
                'data',
                'notas',
                'cliente',
                'cnpjCliente',
                'remetente',
                'cnpjRemetente',
                'destinatario',
                'cnpjDestinatario',
                'totalFrete',
                'obs',
              ],
              trim: true,
              fromLine: 2,
            })
          )
          .on('data', (row: MovementCsvRow) => {
            // console.log(row.cliente);
            csvData.push(row);
          })
          .on('end', () => {
            csvData.map(async (mov) => {
              try {
                let sender = await Sender.firstOrCreate(
                  { document: mov.cnpjRemetente },
                  {
                    name: mov.remetente,
                    address: 'rua 1',
                  }
                );

                console.log(sender.id);

                await Movement.create({
                  minuta: mov.minuta,
                  nf: mov.notas,
                  dataEmissao: DateTime.fromFormat(mov.data, 'dd/MM/y'),
                  senderId: sender.id,
                  transporterId: transporterId,
                });
              } catch (error) {
                console.log(error);
              }
            });
          });
      } catch (error) {
        console.log(error);

        return response.send(error);
      }
    }
  }

  public async getAllMovement({ response }: HttpContextContract) {
    const date = DateTime.fromFormat('31/10/2021', 'dd/MM/y');

    return response.ok(date);
  }
}
