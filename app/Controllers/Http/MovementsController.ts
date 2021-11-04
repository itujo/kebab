import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Movement, { MovementCsvRow } from 'App/Models/Movement';
import Sender from 'App/Models/Sender';
import Transporter from 'App/Models/Transporter';
import parse from 'csv-parse';
import { createReadStream } from 'fs';
import { DateTime } from 'luxon';
export default class MovementsController {
  public async index({ response }: HttpContextContract) {
    const movements = await Movement.query().preload('sender').preload('transporter');

    return response.ok(movements);
  }

  public async import({ request, response }: HttpContextContract) {
    const transporterId = request.param('transporterId');

    const transporter = await Transporter.find(transporterId);

    if (!transporter) {
      return response.badRequest({
        status: 'error',
        message: `transporter with id ${transporterId} not found`,
      });
    }

    const file = request.file('file', {
      extnames: ['csv'],
    });

    if (!file) {
      return response.badRequest({
        status: 'error',
        message: 'no file provided',
      });
    }

    if (file && !file?.isValid) {
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
          .on('end', async () => {
            await Promise.all(
              csvData.map(async (mov) => {
                try {
                  await Sender.create({
                    name: mov.remetente,
                    address: 'rua 1',
                    document: mov.cnpjRemetente,
                  });
                } catch (error) {}
              })
            );

            await Promise.all(
              csvData.map(async (mov) => {
                try {
                  const sender = await Sender.findBy('document', mov.cnpjRemetente);

                  await Movement.create({
                    minuta: mov.minuta,
                    nf: mov.notas,
                    dataEmissao: DateTime.fromFormat(mov.data, 'dd/MM/y'),
                    senderId: sender!.id,
                    transporterId: transporterId,
                  });
                } catch (error) {
                  console.log(error);
                }
              })
            );
          });
      } catch (error) {
        console.log(error.Exception);

        return response.send(error);
      }
    }
  }
}
