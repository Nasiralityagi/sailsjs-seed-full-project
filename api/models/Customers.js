/**
 * Customers.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        'first_name': {
            'type': 'string',
            'required': true
        },
        'last_name': {
            'type': 'string',
            // 'required': true
            allowNull: true
        },
        'email': {
            'type': 'string',
            //'required': true,
            //'unique': true
            allowNull: true
        },
        'username': {
            'type': 'string',
            //'required': true,
            //'unique': true
            allowNull: true
        },
        'password': {
            'type': 'string',
            // 'required': true
            allowNull: true
        },
        'mobile': {
            'type': 'string',
            'required': true,
            // 'unique': true
        },
        'customer_verified': {
            'type': 'boolean',
            allowNull: true
        },
        'manually_mobile_verified': {
            'type': 'boolean',
            allowNull: true
        },
        'cnic': {
            'type': 'string',
            // 'required': true,
            // 'unique': true
            allowNull: true
        },
        'status_id': {
            'type': 'number',
            // 'required': true,
            'defaultsTo': 1
        },
        // Association

        connection: {
            collection: 'connection',
            via: 'customers'
        },
        stockout: {
            collection: 'stockout',
            via: 'customers'
        },
        customerverify: {
            collection: 'customerverify',
            via: 'customers'
        },
        invoices: {
            collection: 'invoices',
            via: 'customers'
        },

    },

};

