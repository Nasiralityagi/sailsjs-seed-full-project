/**
 * StockIn.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    'cost_price': {
      'type': 'ref',
      'columnName': 'cost_price',
      'columnType': 'double',
      'required': true,
    },
    'purchase_date': {
      'type': 'ref',
      'required': true,
      'columnName': 'purchase_date',
      'columnType': "datetime"
    },
    'quantity': {
      'type': 'number',
    },
    'invoice_no': {
      'type': 'string',
    },
    'cargo_service': {
      'type': 'string',
    },
    'bilty_no': {
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


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    'items': {
      'columnName': 'item_id',
      'model': 'items',
      'required' : true,
    },
    'warehouse': {
      'columnName': 'warehouse_id',
      'model': 'warehouse',
      'required' : true,
    },
    'supplier': {
      'columnName': 'supplier_id',
      'model': 'supplier',
    },


  },

};

