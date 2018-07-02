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
    if (!req.param('bandwidth')) {

      return res.badRequest("bandwidth required");
    }
    if (!req.param('max_connection') || !_.isString(req.param('max_connection'))) {

      return res.badRequest("max_connection required");
    }
    const process = async () => {

      const newBasestation = await Basestation.create({
        'name': req.param('name'),
        'address': req.param('address'),
        'lat': req.param('lat'),
        'lag': req.param('lag'),
        'status_id': Status.ACTIVE,
        'bandwidth': req.param('bandwidth'),
        'max_connection': req.param('max_connection')  
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
        where: {},
        limit: parseInt(params.per_page),
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
  
        const Basestation_count = await Basestation.count();
        let Basestations = await Basestation.find(queryObject);
        // .paginate({
        //   page: parseInt(params.page, 10),
        //   limit: parseInt(params.per_page, 10) // Overwrite the project-wide settings
  
        // });
        const responseObject = {
          Basestations: Basestations,
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
      let BasestationId = req.param('id')
  
      const getBasestation = async() => {
        let Basestation = await Basestation.findOne({
          id: BasestationId
        });
  
        if (Basestation)
          return Basestation;
        else
          return new CustomError('Basestation not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
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
          return new CustomError('Invalid Basestation  Id', {
            status: 403
          });
        }
  
        let Basestation = {};
  
        if (req.param('name') != undefined && _.isString(req.param('name'))) {
          Basestation.name = req.param('name');
        }
        if (req.param('address') != undefined && _.isNumber(req.param('address'))) {
          Basestation.address = req.param('address');
        }
        if (req.param('bandwidth') != undefined && _.isString(req.param('bandwidth'))) {
          Basestation.bandwidth = req.param('bandwidth');
        }
        if (req.param('status_id') != undefined && _.isString(req.param('status_id'))) {
          Basestation.status_id = req.param('status_id');
        }
  
  
        const updatedBasestation = await Basestation.update({
          id: BasestationId
        }, Basestation);
  
        if (updatedBasestation)
          return updatedBasestation;
        return new CustomError('Some error occurred. Please contact development team for help.', {
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
  
      const deleteBasestation = async() => {
  
        const checkBasestation = await Basestation.count({
          id: BasestationId
        });
  
        if (checkBasestation < 1) {
          return new CustomError('Invalid Basestation Id', {
            status: 403
          });
        }
  
  
        const deletedBasestation = await Basestation.update({
          id: BasestationId
        }, {
          status_id: Status.DELETED
        });
  
        if (deletedBasestation)
          return deletedBasestation;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteBasestation()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};
