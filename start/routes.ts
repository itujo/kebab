/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck';
import Route from '@ioc:Adonis/Core/Route';
import Database from '@ioc:Adonis/Lucid/Database';
import Migrator from '@ioc:Adonis/Lucid/Migrator';
import Application from '@ioc:Adonis/Core/Application';

Route.get('/', async ({ view }) => {
  return view.render('welcome');
});

Route.group(() => {
  Route.group(() => {
    Route.post('/movement/import/:transporterId', 'MovementsController.import');

    Route.resource('/movement', 'MovementsController'); // /api/v1/users
    Route.resource('/transporter', 'TransportersController'); // /api/v1/posts
  }).prefix('/v1');

  // Route.resource('movement', 'MovementsController');
  // Route.resource('transporter', 'TransportersController');

  // // Route.group(() => {
  // // }).prefix('transporter');

  Route.get('/migrate', async () => {
    const migrator = new Migrator(Database, Application, {
      direction: 'up',
      dryRun: false,
      // connectionName: 'pg',
    });

    await migrator.run();
    return migrator.migratedFiles;
  });

  Route.get('health', async ({ response }) => {
    const report = await HealthCheck.getReport();

    return report.healthy ? response.ok(report) : response.badRequest(report);
  });
}).prefix('/api');
