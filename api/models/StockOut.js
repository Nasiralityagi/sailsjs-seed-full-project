/**
 * StockOut.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    'sale_price': {
      'type': 'ref',
      'columnName': 'sale_price',
      'columnType': 'double',
      'required': true,
    },
    'sale_date': {
      'type': 'ref',
      'required': true,
      'columnName': 'sale_date',
      'columnType': "datetime"
    },
    'quantity': {
      'type': 'number',
    },
    'total': {
      'type': 'number',
    },
    'area': {
      'type': 'string',
    },
    'invoice_no': {
      'type': 'string',
    },
    'description': {
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
    'dealer': {
      'columnName': 'dealer_id',
      'model': 'user',
    },
    'customers': {
      'columnName': 'customer_id',
      'model': 'customers',
    },
  },

};

