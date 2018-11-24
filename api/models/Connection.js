/**
 * Connection.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    
  attributes: {

    'address': {
      'type': 'string',
      // 'required': true
      allowNull:true
    },
    'connection_price': {
      'type': 'ref',
      'columnType': 'double',
      // allowNull:true
    },
    'doc_verified': {
      'type': 'boolean',
      defaultsTo: false
    },
    'router_of': {
      'type': 'number',
      // 'required': true
      allowNull:true,
    },
    'router_brand': {
      'type': 'string',
      allowNull:true,
    },
    'router_model': {
        'type': 'string',
        allowNull:true,
    },
    'router_price': {
      'type': 'ref',
      'columnType': 'double',
      // allowNull:true
    },
    'drop_wire_of': {
        'type': 'number',
        // 'required': true,
        allowNull:true,
    },
    'drop_wire_length': {
        'type': 'string',
        allowNull:true,
    },
    'price_per_meter': {
      'type': 'ref',
      'columnType': 'double',
      // allowNull:true,
    },       
    'is_wireless': {
        'type': 'boolean',
        allowNull:true
    },
    'lat': {
      'type': 'string',
      allowNull:true
    },
    'long': {
      'type': 'string',
      allowNull:true
    },
    'registration_date': {
      'type': 'ref', 
      'columnType': 'datetime',
      // allowNull:true
    },
    'in_review': {
      'type': 'boolean',
      // 'required': true,
      'defaultsTo': false,
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },
    'requested_status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 16
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
      collection: 'connrenewal',
      via: 'connection'
    },
    rejectdoc:{
      collection:'rejectdoc',
      via: 'connection'
      // required : true,
    },
  },

};

