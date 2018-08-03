/**
 * UserConnection.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    
  attributes: {

    'address': {
      'type': 'string',
      // 'required': true
    },
    'username': {
      'type': 'string',
    },
    'password': {
      'type': 'string',
    },
    'connection_price': {
      'type': 'ref',
      'columnType': 'double'
    },
    'router_of': {
      'type': 'number',
      // 'required': true
    },
    'router_brand': {
      'type': 'string',
    },
    'router_model': {
        'type': 'string',
    },
    'router_price': {
      'type': 'ref',
      'columnType': 'double'
    },
    'drop_wire_of': {
        'type': 'number',
        // 'required': true,
    },
    'drop_wire_length': {
        'type': 'string',
    },
    'price_per_meter': {
      'type': 'ref',
      'columnType': 'double'
    },       
    'is_wireless': {
        'type': 'boolean',
    },
    'lat': {
      'type': 'string',
    },
    'lng': {
      'type': 'string',
    },
    'registration_date': {
      'type': 'ref', 
      'columnType': "datetime"
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },
    // association 
    'customers': {
      'columnName': 'customer_id',
      'model': 'customers',
      'required': true
    },
    basestation:{
      columnName: 'basestation_id',
      model:'basestation',
      // required : true,
    },
    'packages': {
      'columnName': 'package_id',
      'model': 'packages',
      'required' : true,
    },
    'salesman': {
      'columnName': 'salesman_id',
      'model': 'user',
    },
    'dealer': {
      'columnName': 'dealer_id',
      'model': 'user',
    },
    'installed_by': {
      'columnName': 'installed_by',
      'model': 'user',
    },
    // Association
    connRenewal: {
      collection: 'connRenewal',
      via: 'userconnection'
    },
  },

};

