import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { Consulta, SimexpressApiReturn } from '@types';
import Manifest from 'App/Models/Manifest';
import Movement, { MovementCsvRow } from 'App/Models/Movement';
import Sender from 'App/Models/Sender';
import SimexpressStatus from 'App/Models/SimexpressStatus';
import JadlogStatus from 'App/Models/JadlogStatus';
import Transporter from 'App/Models/Transporter';
import { Brudam, DiretaCfg, JadLogCfg } from 'App/Models/utils/helpers';
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
                message: `erro ao importar manifesto: ${fileName}`,
              });
            }
          });
        return response.send({
          status: 'ok',
          message: `manifesto ${file.clientName} importado com sucesso`,
        });
      } catch (error) {
        return response.internalServerError({
          status: 'error',
          message: `manifesto ${file.clientName} ja foi importado`,
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

    let delivered: string[] = [];
    let notDelivered: string[] = [];
    let noUpdate: string[] = [];

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
              if (movement.status !== track.situacao.toLocaleLowerCase()) {
                movement.status = track.situacao.toLocaleLowerCase();
                movement.dataStatus = DateTime.now();

                await movement.save();
              }
              notDelivered.push(movement.minuta);
            }

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
                    delivered.push(movement.minuta);
                  } else {
                    if (track === tracking.at(-1)) {
                      movement.status = track.situacao.toLocaleLowerCase();
                      movement.dataStatus = luxonTrackDate;

                      await movement.save();
                      notDelivered.push(movement.minuta);
                    }
                  }
                })
                .catch(async () => {});
            } else {
              if (track === tracking.at(-1)) {
                noUpdate.push(movement.minuta);
              }
            }
          }
        })
        .catch(() => {});
    }

    return {
      totalDocs: movements.length,
      delivered: {
        docs: delivered.length,
        delivered,
      },
      notDelivered: {
        docs: delivered.length,
        notDelivered,
      },
      noUpdate: {
        docs: delivered.length,
        noUpdate,
      },
    };
  }

  public async runJadlog({ request }: HttpContextContract) {
    const transporterId = request.param('transporterId');
    const minuta = request.param('minuta');

    const brdAxios = await new Brudam(transporterId).createBrdAxios();
    const jadlogCfg = await new JadLogCfg(transporterId).createAxios();

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

    let delivered: string[] = [];
    let notDelivered: string[] = [];
    let noUpdate: string[] = [];

    for await (const movement of movements) {
      const { data } = await jadlogCfg.post(`/tracking/consultar`, {
        consulta: [
          {
            df: {
              nf: movement.nf,
              cnpjRemetente: movement.sender.document,
              tpDocumento: 1,
            },
          },
        ],
      });

      const consultas = data.consulta as Consulta[];
      const consulta = consultas[0];

      if (consulta.error) {
        // console.log(consulta.error);

        if (movement.status !== consulta.error.descricao.toLowerCase()) {
          movement.status = consulta.error.descricao.toLowerCase();
          movement.dataStatus = DateTime.now();

          await movement.save();
        }
      } else {
        const { eventos } = consulta.tracking;

        for await (const evento of eventos) {
          const luxonTrackDate = DateTime.fromFormat(evento.data, 'yyyy-MM-dd hh:mm:ss');

          if (luxonTrackDate > movement.dataStatus) {
            const status = await JadlogStatus.findBy(
              'description_jadlog',
              evento.status.toLowerCase()
            );
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
                        codigo: status?.statusBrudamId,
                        data: evento.data,
                        obs: `: ${evento.status.toLocaleLowerCase()} - ${evento.unidade.toLowerCase()}`,
                        recebedor: {
                          nome: consulta.tracking.recebedor?.nome || 'x',
                          documento: consulta.tracking.recebedor?.doc || 'x',
                          grau: '',
                        },
                      },
                    ],
                  },
                ],
              })
              .then(async (brdRes) => {
                // console.dir(brdRes.data, { depth: null });

                if (evento.status === 'ENTREGUE' && brdRes.data.status === 1) {
                  movement.closed = true;
                  movement.recebedor = consulta.tracking.recebedor?.nome;
                  movement.dataRecebimento = luxonTrackDate;
                  movement.status = evento.status.toLocaleLowerCase();
                  movement.dataStatus = luxonTrackDate;

                  await movement.save();
                  delivered.push(movement.minuta);
                } else {
                  if (evento === eventos.at(-1)) {
                    movement.status = evento.status.toLocaleLowerCase();
                    movement.dataStatus = luxonTrackDate;

                    await movement.save();
                    notDelivered.push(movement.minuta);
                  }
                }
              })
              .catch(async () => {
                // console.dir(err, { depth: null });
              });
          } else {
            if (evento === eventos.at(-1)) {
              noUpdate.push(movement.minuta);
            }
          }
        }
      }
    }

    return {
      delivered: {
        docs: delivered.length,
        delivered,
      },
      notDelivered: {
        docs: notDelivered.length,
        notDelivered,
      },
      noUpdate: {
        docs: noUpdate.length,
        noUpdate,
      },
    };
  }
}
