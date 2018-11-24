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
var socket = require('socket.io-client');
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
  start.addRoutes();

  //addAAccount 
  // start.addAccount();

 // testing new stuff
//  var io = require('socket.io')(sails.hooks.http.server);
//  io.on('connection', function(socket){

//    console.log('a user connected');
//    // io.emit('message', {type:'new-message', text: message});  
//   //  io.emit('ledger');
//  });
// io.connect();
// sails.sockets.join('test', 'PionerasDev');

  sails.sockets.join('connection');
  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  
  //Start crons jobs for notification.
  start.startCronJobs();

  // to clean database 
  // start.cleanDatabase();
 
 // importData from googlesheet
//  importData.importData();

  // check connection to expire
  util.expireConnection()

  // Check connection if there are in review change there status
  start.connectionCheck();

  util.customerDelete();


  return done();

};

