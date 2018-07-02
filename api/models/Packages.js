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
    'status_id': {
      'type': 'number',
      // 'required': true,
      'defaultsTo': 1
    },

  },

};

