/**
 * JournalEntry.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
 
  JournalEntry:1,
  BankEntry:2,
  CashEntry:3,
  CreditCardEntry:4,
  DebitCardEntry:5,

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    'date': {
      'type': 'ref', 
      'columnType': "datetime"
    },
    'entry_type': {
      'type': 'number',
    },
    'reference_number': {
      'type': 'string',
    },
    'reference_date': {
      'type': 'ref', 
      'columnType': "datetime"
    },
    'user_remarks': {
      'type': 'string',
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 2
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    journalentryaccount: {
      collection: 'journalentryaccount',
      via: 'journalentry'
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
   
  },

};

