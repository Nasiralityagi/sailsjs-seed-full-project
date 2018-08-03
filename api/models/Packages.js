/**
 * Packages.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    'package_name': {
      'type': 'string',
      'required': true,
    },
    'bandwidth': {
      'type': 'string',
    },
    'cost_price': {
      'type': 'ref',
      'columnType': "double"

    },
    'data_limit': {
      'type': 'string',
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },
    userconnection: {
      collection: 'userconnection',
      via: 'packages'
    },
    dealerPackages: {
      collection: 'dealerpackages',
      via: 'packages'
    },
  },

};

