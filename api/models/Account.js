/**
 * Account.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  
 //RootType 
  ASSET:1,
  LIABILITY:2,
  EQUITY:3,
  INCOME:4,
  EXPENSE:5,

  //AccountType
  BANK:1,
  CASH:2,

  attributes: {

   
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    'name': {
      'type': 'string',
      'required': true,
    },
    'root_type': {
      'type': 'number',
    },
    'account_type': {
      'type': 'number',
    },
    'account_number': {
      'type': 'number',
    },
    'is_group': {
      'type': 'boolean',
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 2
    },

    
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    parent:{
      collection:'account',
      via: 'children'
    },
    children: {
      collection: 'account',
      via: 'parent'
    },
    
    accountledgerentry:{
      collection:'accountledgerentry',
      via:'account'
    },
    
    journalentryaccount: {
      collection: 'journalentryaccount',
      via: 'account'
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

};

