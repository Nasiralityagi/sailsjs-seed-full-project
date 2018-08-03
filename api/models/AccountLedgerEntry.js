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

};

