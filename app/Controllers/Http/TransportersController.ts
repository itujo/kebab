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

    const jadlog = await Transporter.create({
      name: 'jadlog',
      document: '04884082000135',
      address: 'AV JORNALISTA PAULO ZINGG, 810',
      brdUser: '46277c1e11ce9d016499fa44d99afdbd',
      brdPwd: 'ee7f4264885d5e4f789fbb443dc259995838fb22668d372a8e3e82377902cf09',
      apiToken:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOjcwNTg1LCJkdCI6IjIwMjEwMTEyIn0.w4k5ll8JvhXZteV8i5aWAaFhl4KF2uum1wiB0xXqjx0',
      statusTable: 'jadlog_statuses',
    });

    return { direta, jadlog };
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
