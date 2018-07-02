/**
 * ConnectionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var _ = require('lodash'); 
module.exports = {

    create:function(req,res){       

    if (!req.param('address') || !_.isString(req.param('address'))) {
      return res.badRequest("address required");
    }
    if (!req.param('is_wireless')) {
      return res.badRequest("is_wireless required");
    }
    const process = async () => {

      const newConnection = await Connection.create({
        'address': req.param('address'),
        'router_price': req.param('router_price'),
        'drop_wire': req.param('drop_wire'),
        'wire_length': req.param('wire_length'),
        'price_per_meter': req.param('price_per_meter'),
        'is_wireless': req.param('is_wireless'),
        'lat': req.param('lat'),
        'lag': req.param('lag'),
        'customers': req.param('customer_id'),
        'basestation': req.param('basestation_id'),
        'salesman': req.param('salesman_id'),
        'dealer': req.param('dealer_id'),
        'status_id': Status.ACTIVE,    
      }).fetch();
     
      if (newConnection)
        return newConnection;

      throw new CustomError('Some error occurred. Please contact support team for help. ');
    }

    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
    },
    find: function (req, res) {
      var params = req.allParams(),
        params = _.defaults(params, {
          filters: [],
          page: 1,
          per_page: 20,
          sort_dir: 'ASC',
          sort: 'router_price',
          query: ''
        });
  
      var sortable = ['router_price'];
  
      var filters = params.filters;
  
      if (!filters || !_.isArray(filters)) {
        filters = [];
      }
  
      if (params.page) {
        if (!parseInt(params.page) || !_.isNumber(parseInt(params.page))) {
          return res.badRequest({
            err: 'Invalid page field value'
          });
        }
      }
      if (params.per_page) {
        if (!parseInt(params.per_page) || !_.isNumber(parseInt(params.per_page))) {
          return res.badRequest({
            err: 'Invalid per_page field value'
          });
        }
      }
      if (params.query) {
        if (!_.isString(params.query)) {
          return res.badRequest({
            err: 'Invalid search_term field value'
          });
        }
      }
    
      let queryObject = {
        where: {},
        limit: parseInt(params.per_page),
        sort: '',
      };
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
      queryObject.where.or = [{
        'router_price': {
          'like': '%' + params.query + '%'
        }
      }];
  
  
     
  
      const getConnection = async() => {
  
        const Connection_count = await Connection.count();
        let connection = await Connection.find(queryObject).populate('customers').populate('basestation')
            .populate('salesman').populate('dealer') ;
        // .paginate({
        //   page: parseInt(params.page, 10),
        //   limit: parseInt(params.per_page, 10) // Overwrite the project-wide settings
  
        // });
        const responseObject = {
            connection: connection,
          totalCount: Connection_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getConnection()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let ConnectionId = req.param('id')
      console.log(ConnectionId);
      const getConnection = async() => {
        let connection = await Connection.findOne({
          id: ConnectionId
        }).populate('customers').populate('basestation')
        .populate('salesman').populate('dealer') ;
  
        if (connection)
          return connection;
        else
          return new CustomError('Connection not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getConnection()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      //make sure jobBoard id is provided
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let ConnectionId = req.param('id');
  
      const updateConnection = async() => {
  
        const oldConnection = await Connection.count({
          id: ConnectionId
        });
  
        if (oldConnection < 1) {
          return new CustomError('Invalid Connection  Id', {
            status: 403
          });
        }
  
        let Connection = {};
  
        if (req.param('file_name') != undefined && _.isString(req.param('file_name'))) {
          Connection.file_name = req.param('file_name');
        }
        if (req.param('file_path') != undefined && _.isNumber(req.param('file_path'))) {
          Connection.file_path = req.param('file_path');
        }
  
  
        const updatedConnection = await Connection.update({
          id: ConnectionId
        }, Connection);
  
        if (updatedConnection)
          return updatedConnection;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateConnection()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      //make sure jobBoard id is provided
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let ConnectionId = req.param('id');
  
      const deleteConnection = async() => {
  
        const checkConnection = await Connection.count({
          id: ConnectionId
        });
  
        if (checkConnection < 1) {
          return new CustomError('Invalid Connection Id', {
            status: 403
          });
        }
  
  
        const deletedConnection = await Connection.update({
          id: ConnectionId
        }, {
          status_id: Status.DELETED
        });
  
        if (deletedConnection)
          return deletedConnection;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteConnection()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};