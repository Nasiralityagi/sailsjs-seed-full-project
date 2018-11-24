/**
 * ConnRenewal.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    'serial_number': {
      'type': 'number',
      // 'required': true
      allowNull:true
    },
    'activation_date': {
      'type': 'ref',
      'required': true,
      'columnName': 'activation_date',
      'columnType': "datetime"
    },
    'expiration_date': {
      'type': 'ref',
      'required': true,
      'columnName': 'expiration_date',
      'columnType': "datetime"
    },
    'billing_date': {
      'type': 'ref',
      'required': true,
      'columnType': "datetime"
    },
    'renewal_price': {
      'type': 'ref',
      'columnName': 'renewal_price',
      'columnType': 'double'
    },
    'cost_price': {
      'type': 'ref',
      'columnName': 'cost_price',
      'columnType': 'double'
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },
    'is_advance': {
      'type': 'boolean',
      // 'required': true,
      'defaultsTo': true
    },
    // association 

    'connection': {
      'columnName': 'connection_id',
      'model': 'connection',
      'required': true
    },
    'packages': {
      'model': 'packages',
    },

    // function
    // toJSON: function () {
    //   var obj = this.toObject();
    //   delete obj.cost_price;
    //   return obj;
    // }
   
  },

};

