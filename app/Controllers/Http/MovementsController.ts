import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { SimexpressApiReturn } from '@types';
import Manifest from 'App/Models/Manifest';
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

    const fileName = file.clientName.split('.')[0];

    const matches = /^\d{4}$/g.test(fileName);

    if (!matches) {
      return response.badRequest({
        status: 'error',
        message: 'file name not allowed',
      });
    }

    if (file && !file?.isValid) {
      return file?.errors;
    }

    const manifest = await Manifest.findBy('manifestNumber', fileName);

    if (manifest) {
      return response.badRequest({
        status: 'error',
        message: 'manifest already exists',
      });
    }

    if (file) {
      try {
        await file?.move(Application.tmpPath('uploads'), {
          overwrite: true,
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
            const manifest = await Manifest.create({
              manifestNumber: fileName,
              manifestDate: DateTime.fromFormat(csvData.at(-1)!.data, 'dd/MM/y'),
            });

            if (manifest.$isPersisted) {
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

              let imported: Movement[] = [];
              let errors: any[] = [];

              await Promise.all(
                csvData.map(async (mov) => {
                  try {
                    const sender = await Sender.findBy(
                      'document',
                      mov.cnpjRemetente.replace(/[^0-9]/gi, '')
                    );

                    const dataMov = DateTime.fromFormat(mov.data, 'dd/MM/y');

                    const movement = await Movement.create({
                      minuta: mov.minuta,
                      nf: mov.notas,
                      dataEmissao: dataMov,
                      senderId: sender!.id,
                      transporterId: transporterId,
                      manifestId: manifest.id,
                    });

                    imported.push(movement);
                  } catch (error) {
                    errors.push(mov);
                  }
                })
              );

              return response.send({ errors, imported });
            } else {
              return response.internalServerError({
                status: 'error',
                message: `error creating manifest ${fileName}`,
              });
            }
          });
        return response.send({
          status: 'ok',
          message: `success uploading file ${file.clientName}`,
        });
      } catch (error) {
        console.log(error);

        return response.internalServerError({
          error: 'file already exists',
          message: `file ${file.clientName} is already imported`,
        });
      }
    }
  }

  public async runSimexpress({ request }: HttpContextContract) {
    const transporterId = request.param('transporterId');
    const minuta = request.param('minuta');

    const brdAxios = await new Brudam(transporterId).createBrdAxios();
    const diretaAxios = await new DiretaCfg(transporterId).createAxios();

    const movements = await Movement.query()
      .where(
        minuta
          ? {
              transporterId,
              closed: false,
              minuta,
            }
          : {
              transporterId,
              closed: false,
            }
      )
      .preload('sender')
      .preload('transporter');

    let delivered: Movement[] = [];
    let notDelivered: Movement[] = [];
    let noUpdate: Movement[] = [];

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
                : DateTime.fromFormat(`${track.data} 11:11:11`, 'yyyyMMdd hh:mm:ss');

            const statusSim = await SimexpressStatus.findBy(
              'id_simexpress',
              parseInt(track.codigoInterno, 10)
            );

            if (track.codigoInterno === '997') {
              movement.status = track.situacao.toLocaleLowerCase();
              movement.dataStatus = DateTime.now();

              await movement.save();
              notDelivered.push(movement);
            }

            console.log({
              luxonTrackDate,
              data: movement.dataStatus,
            });

            console.log(luxonTrackDate >= movement.dataStatus);

            // if track is most recent than in db

            if (luxonTrackDate >= movement.dataStatus) {
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
                    movement.dataRecebimento = luxonTrackDate;
                    movement.status = track.situacao.toLocaleLowerCase();
                    movement.dataStatus = luxonTrackDate;

                    await movement.save();
                    delivered.push(movement);
                  } else {
                    if (track === tracking.at(-1)) {
                      movement.status = track.situacao.toLocaleLowerCase();
                      movement.dataStatus = luxonTrackDate;

                      await movement.save();
                      notDelivered.push(movement);
                    }
                  }
                  console.dir(brdRes.data, { depth: null });
                })
                .catch(async (brdErr) => {
                  console.log(brdErr);
                });
            } else {
              if (track === tracking.at(-1)) {
                noUpdate.push(movement);
              }
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    return { totalDocs: movements.length, delivered, notDelivered, noUpdate };
  }

  public async runJadlog({}: HttpContextContract) {}
}
