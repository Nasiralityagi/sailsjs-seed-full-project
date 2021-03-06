/**
 * User.js
 *
 * @description :: This is an account of a user.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


const RoleType = [0, 1, 2, 3, 4];
module.exports = {

    
    tableName: 'users',

    // ADMIN: 0,
    // DEALER: 1,
    // SALES_PERSON: 2,
    // ACCOUNTANT: 3,
    // LOGIN_MANAGER: 4,

   

    attributes: {

        // 'role_type': {
        //     'type': 'number',
        //     'isIn': RoleType,
        //     'required': true
        // },
        'title': {
            'type': 'string',
            'isIn': ['Mr', 'Mrs', 'Miss'],
            'defaultsTo': 'Mr'
        },
        'first_name': {
            'type': 'string',
            'required': true
        },
        'last_name': {
            'type': 'string',
            'required': true
        },
        'username': {
            'type': 'string',
            'required': true,
            'unique': true
        },
        'email': {
            'type': 'string',
            //'required': true,
            //'unique': true
        },
        'email_signature': {
            'type': 'string'
        },
        'password': {
            'type': 'string',
            'required': true
        },
        'password_reset': {
            'type': 'boolean',
            'defaultsTo': false
        },
        
        'mobile': {
            'type': 'string',
            'required': true,
            'unique': true
        },       
        'status_id': {
            'type': 'number',
            // 'required': true,
            'defaultsTo': 1
        },
        'image': {
            'type': 'string',
            defaultsTo: 'images/default-profile.png'
        },        
        'job_title': {
            'type': 'string'
        },        
        'active': {
            'type': 'number',
            'defaultsTo': 1
        },
        'is_admin': {
            'type': 'boolean',
            'defaultsTo': false
        },      

        // Associations
        'role': {
            'columnName': 'role_id',
            'model': 'roles',
            'required' : true,
          },
        salesman: {
            collection: 'connection',
            via: 'salesman'
        },
        dealer: {
            collection: 'connection',
            via: 'dealer'
        },
        dealer: {
            collection: 'dealerpackages',
            via: 'dealer'
        },
        usersroutes: {
            collection: 'usersroutes',
            via: 'user'
        },
        dealermap: {
            collection: 'dealermap',
            via: 'dealer'
        },
        registered_by: {
            collection: 'complaints',
            via: 'registered_by'
        },
        assigned_to: {
            collection: 'complaints',
            via: 'assigned_to'
        },
        dealer: {
            collection: 'complaints',
            via: 'dealer'
        },
        dealer: {
            collection: 'stockout',
            via: 'dealer'
        },
        installed_by: {
            collection: 'connection',
            via: 'installed_by'
        },
       
    }
};
