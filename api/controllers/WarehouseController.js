/**
 * WarehouseController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  create: async function (req, res) {

    if (!req.param('name') || !_.isString(req.param('name'))) {
      return res.badRequest("name required");
    }

    if (!req.param('location') || !_.isString(req.param('location'))) {
      return res.badRequest("location required");
    }
    const countWarehouse = await Warehouse.count({ name: req.param('name') });
    if (countWarehouse >= 1) {
      throw new CustomError('warehouse name already exsist', {
        status: 403
      });
    }
    const process = async () => {

      const newWarehouse = await Warehouse.create({
        'name': req.param('name'),
        'location': req.param('location'),
        'status_id': Status.ACTIVE,
        'createdBy': req.token.user.id, // current logged in user id    
      }).fetch();

      if (newWarehouse)
        return newWarehouse;

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
      where: { status_id: { '!=': Status.DELETED } },
      // limit: parseInt(params.per_page),
      sort: '',
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'name': {
        'like': '%' + params.query + '%'
      }
    }];




    const getWarehouse = async () => {

      const Warehouse_count = await Warehouse.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (Warehouse_count < 1) {
        throw new CustomError('warehouse not found', {
          status: 403
        });
      }
      let warehouse = await Warehouse.find(queryObject);;
      if (warehouse) {
        const responseObject = {
          warehouse: warehouse,
          totalCount: Warehouse_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
      throw new CustomError('warehouse not found', {
        status: 403
      });
    }

    getWarehouse()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let WarehouseId = req.param('id')
    let queryObject = {
      where: { id: WarehouseId, status_id: { '!=': Status.DELETED } }
    };
    const getWarehouse = async () => {
      let warehouse = await Warehouse.findOne(queryObject);

      if (warehouse)
        return warehouse;
      else
        throw new CustomError('Warehouse not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getWarehouse()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let WarehouseId = req.param('id');

    const updateWarehouse = async () => {

      const oldWarehouse = await Warehouse.count({
        id: WarehouseId
      });

      if (oldWarehouse < 1) {
        throw new CustomError('Invalid Warehouse  Id', {
          status: 403
        });
      }

      let warehouse = {};

      if (req.param('name') != undefined && _.isString(req.param('name'))) {
        warehouse.name = req.param('name');
      }
      if (req.param('location') != undefined && _.isString(req.param('location'))) {
        warehouse.location = req.param('location');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        warehouse.status_id = req.param('status_id');
      }


      const updatedWarehouse = await Warehouse.update({
        id: WarehouseId
      }, warehouse).fetch();

      if (updatedWarehouse)
        return updatedWarehouse;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateWarehouse()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let WarehouseId = req.param('id');
    let queryObject = {
      where: { id: WarehouseId, status_id: { '!=': Status.DELETED } }
    };
    const deleteWarehouse = async () => {

      const checkWarehouse = await Warehouse.count(queryObject);

      if (checkWarehouse < 1) {
        throw new CustomError('Invalid warehouse Id', {
          status: 403
        });
      }


      const deletedWarehouse = await Warehouse.update({
        id: WarehouseId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedWarehouse)
        return deletedWarehouse;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteWarehouse()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};
