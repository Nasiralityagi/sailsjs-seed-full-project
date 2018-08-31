/**
 * BasestationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var _ = require('lodash'); 
module.exports = {

    create:function(req,res){       

    if (!req.param('name') || !_.isString(req.param('name'))) {
      return res.badRequest("name required");
    }

    //make sure lastName is provided
    if (!req.param('address') || !_.isString(req.param('address'))) {

      return res.badRequest("address required");
    }
    // console.log(!_.isNumber(req.param('role_type')) + ' value : '+ req.param('role_type'));
    if (!req.param('bandwidth') || !_.isNumber(req.param('bandwidth'))) {

      return res.badRequest("bandwidth required");
    }
    if (!req.param('max_connection') || !_.isNumber(req.param('max_connection'))) {
      return res.badRequest("max_connection required");
    }
    const process = async () => {

      const newBasestation = await Basestation.create({
        'name': req.param('name'),
        'address': req.param('address'),
        'lat': req.param('lat'),
        'long': req.param('long'),
        'status_id': Status.ACTIVE,
        'bandwidth': req.param('bandwidth'),
        'max_connection': req.param('max_connection'),
        'createdBy': req.token.user.id, // current logged in user id
      }).fetch();
     
      if (newBasestation)
        return newBasestation;

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
          sort: 'name',
          query: ''
        });
  
      var sortable = ['name'];
  
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
        where: {status_id :{'!=': Status.DELETED} },
        // limit: parseInt(params.per_page),
        sort: '',
      };
  
      queryObject.where.or = [{
        'name': {
          'like': '%' + params.query + '%'
        }
      }];
  
  
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
  
      const getBasestations = async() => {
  
        const Basestation_count = await Basestation.count({where: {status_id :{'!=': Status.DELETED} }});
        if (Basestation_count < 1){
            throw new CustomError('Basestation not found', {
              status: 403
            });
        }
        let basestation = await Basestation.find(queryObject);
        if (!basestation){
          throw new CustomError('Basestation not found', {
            status: 403
          });
      }
        const responseObject = {
          basestation: basestation,
          totalCount: Basestation_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getBasestations()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let BasestationId = req.param('id');
      let queryObject = {
        where: {id: BasestationId , status_id :{'!=': Status.DELETED} }
      };
      const getBasestation = async() => {
        let basestation = await Basestation.findOne(queryObject);
  
        if (basestation)
          return basestation;
        else
          throw new CustomError('Basestation not found', {
            status: 403
          });
  
        throw new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getBasestation()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let BasestationId = req.param('id');
      
      const updateBasestation = async() => {
        
        const oldBasestation = await Basestation.count({
          id: BasestationId
        });
  
        if (oldBasestation < 1) {
          throw new CustomError('Invalid Basestation  Id', {
            status: 403
          });
        }
  
        let basestation = {};
  
        if (req.param('name') != undefined && _.isString(req.param('name'))) {
          basestation.name = req.param('name');
        }
        if (req.param('address') != undefined && _.isString(req.param('address'))) {
          basestation.address = req.param('address');
        }
        if (req.param('bandwidth') != undefined && _.isString(req.param('bandwidth'))) {
          basestation.bandwidth = req.param('bandwidth');
        }
        if (req.param('lat') != undefined && _.isString(req.param('lat'))) {
          basestation.lat = req.param('lat');
        }
        if (req.param('long') != undefined && _.isString(req.param('long'))) {
          basestation.long = req.param('long');
        }
        if (req.param('max_connection') != undefined && _.isString(req.param('max_connection'))) {
          basestation.max_connection = req.param('max_connection');
        }
        if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
          basestation.status_id = req.param('status_id');
        }
  
        const updatedBasestation = await Basestation.update({
          id: BasestationId
        }, basestation).fetch();
  
        if (updatedBasestation)
          return updatedBasestation;
        throw new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateBasestation()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let BasestationId = req.param('id');
      let queryObject = {
        where: {id: BasestationId , status_id :{'!=': Status.DELETED} }
      };
      const deleteBasestation = async() => {
  
        const checkBasestation = await Basestation.count(queryObject);
  
        if (checkBasestation < 1) {
          throw new CustomError('Invalid Basestation Id', {
            status: 403
          });
        }
  
  
        const deletedBasestation = await Basestation.update({
          id: BasestationId
        }, {
          status_id: Status.DELETED
        }).fetch();
  
        if (deletedBasestation)
          return deletedBasestation;
        throw new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteBasestation()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};
