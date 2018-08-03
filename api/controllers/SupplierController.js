/**
 * SupplierController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create:function(req,res){       

   if (!req.param('first_name') || !_.isString(req.param('first_name'))) {
      return res.badRequest("first_name required");
    }
    if (!req.param('last_name') || !_.isString(req.param('last_name'))) {
      return res.badRequest("last_name required");
    }
   
    const process = async () => {

      const newSupplier = await Supplier.create({
        'first_name': req.param('first_name'),
        'last_name': req.param('last_name'),
        'status_id': Status.ACTIVE,    
      }).fetch();
     
      if (newSupplier)
        return newSupplier;

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
          sort: 'first_name',
          query: ''
        });
  
      var sortable = ['first_name'];
  
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
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
      queryObject.where.or = [{
        'first_name': {
          'like': '%' + params.query + '%'
        }
      }];
  
  
     
  
      const getSupplier = async() => {
  
        const Supplier_count = await Supplier.count({ where: {status_id :{'!=': Status.DELETED} }});
        if (!Supplier_count){
          return new CustomError('supplier not found', {
            status: 403
          });
        }
        let supplier = await Supplier.find(queryObject);
        if (!supplier){
          return new CustomError('supplier not found', {
            status: 403
          });
        }
        const responseObject = {
          supplier: supplier,
          totalCount: Supplier_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getSupplier()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let SupplierId = req.param('id')
      let queryObject = {
        where: {id: SupplierId , status_id :{'!=': Status.DELETED} }
      };
      const getSupplier = async() => {
        let supplier = await Supplier.findOne(queryObject);
  
        if (supplier)
          return supplier;
        else
          return new CustomError('Supplier not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getSupplier()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let SupplierId = req.param('id');
  
      const updateSupplier = async() => {
  
        const oldSupplier = await Supplier.count({
          id: SupplierId
        });
  
        if (oldSupplier < 1) {
          return new CustomError('Invalid Supplier  Id', {
            status: 403
          });
        }
  
        let supplier = {};
  
        if (req.param('first_name') != undefined && _.isString(req.param('first_name'))) {
          supplier.first_name = req.param('first_name');
        }
        if (req.param('last_name') != undefined && _.isString(req.param('last_name'))) {
            supplier.last_name = req.param('last_name');
          }

        if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
          supplier.status_id = req.param('status_id');
        }
  
  
        const updatedSupplier = await Supplier.update({
          id: SupplierId
        }, supplier).fetch();
  
        if (updatedSupplier)
          return updatedSupplier;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateSupplier()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let SupplierId = req.param('id');
      let queryObject = {
        where: {id: SupplierId , status_id :{'!=': Status.DELETED} }
      };
      const deleteSupplier = async() => {
  
        const checkSupplier = await Supplier.count(queryObject);
  
        if (checkSupplier < 1) {
          return new CustomError('Invalid Supplier Id', {
            status: 403
          });
        }
  
  
        const deletedSupplier = await Supplier.update({
          id: SupplierId
        }, {
          status_id: Status.DELETED
        }).fetch();
  
        if (deletedSupplier)
          return deletedSupplier;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteSupplier()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};
