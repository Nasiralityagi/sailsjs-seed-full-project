/**
 * Items.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    // unit = [{
    //   id:1,
    //   value:'Nos',
    // }]

    'name': {
      'type': 'string',
      'required': true,
    },
    'code': {
      'type': 'string',
      'required': true,
    },
    'description': {
      'type': 'string',
    },
    'unit': {
      'type': 'number',
      'required': true,
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 2
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    stockin: {
      collection: 'stockin',
      via: 'items'
    },
    stockout: {
      collection: 'stockout',
      via: 'items'
    },
    Inventory: {
      collection: 'Inventory',
      via: 'items'
    },
    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    
  },

};

