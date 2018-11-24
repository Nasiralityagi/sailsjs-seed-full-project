/**
 * AccountLedgerEntry.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    'date': {
      'type': 'ref', 
      'columnType': "datetime"
    },
    'description': {
      'type': 'string',
    },
    'debit': {
      'type': 'ref',
      'columnType': 'double'
    },
    'credit': {
      'type': 'ref',
      'columnType': 'double'
    },
    'against_account': {
      'type': 'string',
    },
    'reference_type': {
      'type': 'string',
    },
    
    'balance': {
      'type': 'ref',
      'columnType': 'double'
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 2
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    'account': {
      'columnName': 'account_id',
      'model': 'account',
    },
  },
  afterCreate :async function(obj,next){
   
    // sails.socket.emit('ledger' , obj);
    // var io = require('socket.io')(sails.hooks.http.server);
    const account = await Account.findOne(obj.account);
    // console.log('obj' , obj.id , account.name )
    // sails.sockets.join('connection', function(socket){

    //   console.log('a user connected');
    //   sails.io.emit('ledger', obj);
    //   // io.emit('message', {type:'new-message', text: message});  
    //  //  io.emit('ledger');
    // });
    if(account)
      sails.sockets.broadcast(account.name,'balanceUpdate', obj);
    // io.on('ledger' , ()=>{
     
    // });
   
   
    
    next();

  }

};

