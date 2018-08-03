/**
 * ItemsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create:async function(req,res){       

    if (!req.param('name') || !_.isString(req.param('name'))) {
      return res.badRequest("name required");
    }

    if (!req.param('code') || !_.isString(req.param('code'))) {
      return res.badRequest("code required");
    }
    if (!req.param('unit') || !_.isNumber(req.param('unit'))) {
        return res.badRequest("unit required");
    }
    const countItems = await Items.count({name: req.param('name')});
    if(countItems >= 1){
        return new CustomError('Item name already exsist', {
            status: 403
          });
    }
    const process = async () => {

      const newItems = await Items.create({
        'name': req.param('name'),
        'code': req.param('code'),
        'unit': req.param('unit'),
        'description': req.param('description'),
        'status_id': Status.ACTIVE,    
      }).fetch();
     
      if (newItems)
        return newItems;

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
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
      queryObject.where.or = [{
        'name': {
          'like': '%' + params.query + '%'
        }
      }];
  
  
     
  
      const getItems = async() => {
  
        const Items_count = await Items.count({ where: {status_id :{'!=': Status.DELETED} }});
        if (!Items_count){
          return new CustomError('items not found', {
            status: 403
          });
        }
        let items = await Items.find(queryObject);;
        if (!items){
          return new CustomError('items not found', {
            status: 403
          });
        }
        for(let i of items){

        }
        const responseObject = {
          items: items,
          totalCount: Items_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getItems()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let ItemsId = req.param('id')
      let queryObject = {
        where: {id: ItemsId , status_id :{'!=': Status.DELETED} }
      };
      const getItems = async() => {
        let items = await Items.findOne(queryObject);
        
        if (items){
        //   switch (items.unit) {
        //       case value:
                  
        //           break;
          
        //       default:
        //           break;
        //   }
          return items;
        }

        else
          return new CustomError('Items not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getItems()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let ItemsId = req.param('id');
  
      const updateItems = async() => {
  
        const oldItems = await Items.count({
          id: ItemsId
        });
  
        if (oldItems < 1) {
          return new CustomError('Invalid Items  Id', {
            status: 403
          });
        }
  
        let items = {};
  
        if (req.param('name') != undefined && _.isString(req.param('name'))) {
          items.name = req.param('name');
        }
        if (req.param('code') != undefined && _.isString(req.param('code'))) {
          items.code = req.param('code');
        }
        if (req.param('unit') != undefined && _.isNumber(req.param('unit'))) {
          items.unit = req.param('unit');
        }
        if (req.param('description') != undefined && _.isString(req.param('description'))) {
            items.description = req.param('description');
          }
        if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
          items.status_id = req.param('status_id');
        }
  
  
        const updatedItems = await Items.update({
          id: ItemsId
        }, items).fetch();
  
        if (updatedItems)
          return updatedItems;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateItems()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let ItemsId = req.param('id');
      let queryObject = {
        where: {id: ItemsId , status_id :{'!=': Status.DELETED} }
      };
      const deleteItems = async() => {
  
        const checkItems = await Items.count(queryObject);
  
        if (checkItems < 1) {
          return new CustomError('Invalid item Id', {
            status: 403
          });
        }
  
  
        const deletedItems = await Items.update({
          id: ItemsId
        }, {
          status_id: Status.DELETED
        }).fetch();
  
        if (deletedItems)
          return deletedItems;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteItems()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};