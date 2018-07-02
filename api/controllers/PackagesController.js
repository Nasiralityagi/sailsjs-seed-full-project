/**
 * PackagesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var _ = require('lodash'); 
module.exports = {

    create:function(req,res){       
    if (!req.param('package_name') || !_.isString(req.param('package_name'))) {
      return res.badRequest("package_name required");
    }

    
    const process = async () => {

    
      const newPackage = await Packages.create({
        'package_name': req.param('package_name'),
        'status_id': Status.ACTIVE,     
      }).fetch();
     
      if (newUser)
        return newUser;

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
          sort: 'package_name',
          query: ''
        });
  
      var sortable = ['package_name'];
  
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
        'package_name': {
          'like': '%' + params.query + '%'
        }
      }];
  
  
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
  
      const getPackages = async() => {
  
        const packages_count = await Packages.count();
        let packages = await Packages.find(queryObject);
        // .paginate({
        //   page: parseInt(params.page, 10),
        //   limit: parseInt(params.per_page, 10) // Overwrite the project-wide settings
  
        // });
        const responseObject = {
          packages: packages,
          totalCount: packages_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getPackages()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let packagesId = req.param('id')
  
      const getPackage = async() => {
        let packages = await Packages.findOne({
          id: packagesId
        });
  
        if (packages)
          return packages;
        else
          return new CustomError('Packages not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getPackage()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let packagesId = req.param('id');
  
      const updatePackage = async() => {
  
        const oldPackage= await Packages.count({
          id: packagesId
        });
  
        if (oldPackage < 1) {
          return new CustomError('Invalid Packages  Id', {
            status: 403
          });
        }
  
        let Packages = {};
  
        if (req.param('package_name') != undefined && _.isString(req.param('package_name'))) {
          Packages.package_name = req.param('package_name');
        }
  
  
        const updatedPackage = await Packages.update({
          id: packagesId
        }, Packages);
  
        if (updatedPackage)
          return updatedPackage;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updatePackage()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      //make sure jobBoard id is provided
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let packagesId = req.param('id');
  
      const deletePackage = async() => {
  
        const checkPackage = await Packages.count({
          id: packagesId
        });
  
        if (checkPackage < 1) {
          return new CustomError('Invalid Packages Id', {
            status: 403
          });
        }
  
  
        const deletedPackage = await Packages.update({
          id: packagesId
        }, {
          status_id: Status.DELETED
        });
  
        if (deletedPackage)
          return deletedPackage;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deletePackage()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
}