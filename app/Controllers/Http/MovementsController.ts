import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { SimexpressApiReturn } from '@types';
import Movement, { MovementCsvRow } from 'App/Models/Movement';
import Sender from 'App/Models/Sender';
import SimexpressStatus from 'App/Models/SimexpressStatus';
import Transporter from 'App/Models/Transporter';
import { Brudam, DiretaCfg } from 'App/Models/utils/helpers';
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
                    document: mov.cnpjRemetente.replace(/[^0-9]/gi, ''),
                  });
                } catch (error) {}
              })
            );

            await Promise.all(
              csvData.map(async (mov) => {
                try {
                  const sender = await Sender.findBy(
                    'document',
                    mov.cnpjRemetente.replace(/[^0-9]/gi, '')
                  );

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

  public async runSimexpress({ request }: HttpContextContract) {
    const transporterId = request.param('transporterId');

    const brdAxios = await new Brudam(transporterId).createBrdAxios();
    const diretaAxios = await new DiretaCfg(transporterId).createAxios();

    const movements = await Movement.query()
      .where({
        transporterId,
        // senderId: 110,
        closed: false,
        // minuta: 154982,
      })
      .preload('sender')
      .preload('transporter');
    // .limit(1);

    // const toUpdate: Movement[] = [];

    let delivered: Movement[] = [];
    let notDelivered: Movement[] = [];

    for await (const movement of movements) {
      await diretaAxios
        .get(`/consultar`, {
          data: {
            Nr_Pedido: movement.minuta,
          },
        })
        .then(async ({ data }) => {
          const { tracking } = data as SimexpressApiReturn;

          for await (const track of tracking) {
            const luxonTrackDate =
              track.data.length > 8
                ? DateTime.fromFormat(track.data, 'yyyyMMdd hh:mm:ss')
                : DateTime.fromFormat(track.data, 'yyyyMMdd');

            const statusSim = await SimexpressStatus.findBy('id_simexpress', track.codigoInterno);

            // if track is most recent than in db
            if (luxonTrackDate > movement.updatedAt) {
              // console.log(statusSim?.statusBrudamId);
              // console.log(track.data);
              // console.log(track.data.length);

              await brdAxios
                .post(`/tracking/ocorrencias`, {
                  documentos: [
                    {
                      cliente: movement.sender.document,
                      tipo: 'MINUTA',
                      tipo_op: 'MINUTA',
                      minuta: movement.minuta,
                      eventos: [
                        {
                          codigo: statusSim?.statusBrudamId,
                          data: track.data,
                          obs: `: ${track.situacao.toLocaleLowerCase()}`,
                          recebedor: {
                            nome: 'x',
                            documento: 'x',
                            grau: '',
                          },
                        },
                      ],
                    },
                  ],
                })
                .then(async (brdRes) => {
                  if (track.codigoInterno === '101101' && brdRes.data.status === 1) {
                    movement.closed = true;
                    movement.recebedor = 'x';
                    movement.dataRecebimento = DateTime.fromFormat(track.data, 'yyyyMMdd');
                    movement.status = track.situacao.toLocaleLowerCase();
                    await movement.save();
                    delivered.push(movement);
                  } else {
                    movement.status = track.situacao.toLocaleLowerCase();
                    await movement.save();
                    notDelivered.push(movement);
                  }
                  console.log(brdRes.data);
                })
                .catch((brdErr) => {
                  console.log(brdErr);
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    // console.log(toUpdate);

    return { delivered, notDelivered };
  }
}
