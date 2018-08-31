/**
 * Basestation.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    'name': {
      'type': 'string',
      'required': true
    },
    'address': {
        'type': 'string',
        'required': true,
    },
    'lat': {
      'type': 'string',
    },
    'long': {
      'type': 'string',
    },
    'bandwidth': {
      'type': 'number',
      // 'required': true,
    },
    'max_connection': {
      'type': 'number',
      // 'required': true,
    },
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },
    // association
    connection: {
      collection:'connection',
      via: 'basestation'
    }
  },

};

