import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Transporter from 'App/Models/Transporter';

export default class TransportersController {
  public async index({ response }: HttpContextContract) {
    const transporters = await Transporter.all();

    return response.ok(transporters);
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {
    const direta = await Transporter.create({
      name: 'diretalog',
      document: '08612193000143',
      address: 'AV MARQUES DE SAO VICENTE 682',
      brdUser: '65b1a2df5ecb47fd0f945033661a6443',
      brdPwd: '3e309cdbef2405367cce17446c8a1f812b049989f18bfccb265ff464016906b3',
      apiToken: 'SPLOG',
      statusTable: 'simexpress_statuses',
    });

    return direta;
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
