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

 // testing new stuff
  var io = require('socket.io')(sails.hooks.http.server);
  io.on('connection', function(socket){
    console.log('a user connected');
  });
  
  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  
  //Start crons jobs for notification.
  start.startCronJobs();


  // Check connection if there are in review change there status
  start.connectionCheck();

  util.customerDelete();


  return done();

};

