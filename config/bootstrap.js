/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function (done) {

  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return done();
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  // addRoutes
  // start.addRouts();

  //addAAccount 
  // start.addAccount();
  
  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  let queryObject = {
    where: { status_id: { '!=': Status.DELETED } },
    sort: 'id ASC',
  };
  const crons = await Notify.find(queryObject);

  if (!crons) {
    return done();
  }
  //console.log(corns);
  for (const element of crons) {
    util.cronStart(element.id, element.cron_job_time, element.expires_in);
  };

  

  util.customerDelete();


  return done();

};

