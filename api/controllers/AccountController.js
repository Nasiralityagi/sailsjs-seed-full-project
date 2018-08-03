/**
 * AccountController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create:function(req,res){       

    if (!req.param('name') || !_.isString(req.param('name'))) {
      return res.badRequest("name required");
    }

    if (!req.param('root_type') || !_.isNumber(req.param('root_type'))) {
      return res.badRequest("root_type required");
    }
    if (!req.param('parent_id') || !_.isNumber(req.param('parent_id'))) {
      return res.badRequest("parent_id required");
    }
    
    const process = async () => {
      
      const newAcount = await Account.create({
        'name': req.param('name'),
        'root_type': req.param('root_type'),
        'account_type': req.param('account_type'),
        'account_number': req.param('account_number'),
        'is_group': req.param('is_group'),
        'status_id': Status.ACTIVE,
      }).fetch();
     
      if (newAcount){
        await Account.addToCollection(newAcount.id, 'parent', req.param('parent_id'));
        return newAcount;
      }

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
  
  
     
  
      const getAcount = async() => {
  
        const Acount_count = await Account.count({ where: {status_id :{'!=': Status.DELETED} }});
        if (!Acount_count){
          return new CustomError('account not found', {
            status: 403
          });
        }
        let account = await Account.find(queryObject).populate('children');
        if (!account){
          return new CustomError('account not found', {
            status: 403
          });
        }
        const responseObject = {
          account: account,
          totalCount: Acount_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getAcount()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let AcountId = req.param('id')
      let queryObject = {
        where: {id: AcountId , status_id :{'!=': Status.DELETED} }
      };
      const getAcount = async() => {
        let account = await Account.findOne(queryObject).populate('children');
  
        if (account)
          return account;
        else
          return new CustomError('Account not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getAcount()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    update: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let AcountId = req.param('id');
  
      const updateAcount = async() => {
  
        const oldAcount = await Account.count({
          id: AcountId
        });
  
        if (oldAcount < 1) {
          return new CustomError('Invalid Account  Id', {
            status: 403
          });
        }
  
        let account = {};
  
        if (req.param('name') != undefined && _.isString(req.param('name'))) {
          account.name = req.param('name');
        }
        if (req.param('root_type') != undefined && _.isNumber(req.param('root_type'))) {
          account.root_type = req.param('root_type');
        }
        if (req.param('account_type') != undefined && _.isNumber(req.param('account_type'))) {
          account.account_type = req.param('account_type');
        }
        if (req.param('account_number') != undefined && _.isNumber(req.param('account_number'))) {
          account.account_number = req.param('account_number');
        }
        if (req.param('is_group') != undefined && _.isBoolean(req.param('is_group'))) {
            account.is_group = req.param('is_group');
          }
        if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
          account.status_id = req.param('status_id');
        }
  
  
        const updatedAcount = await Account.update({
          id: AcountId
        }, account).fetch();
  
        if (updatedAcount)
          return updatedAcount;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateAcount()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let AcountId = req.param('id');
      let queryObject = {
        where: {id: AcountId , status_id :{'!=': Status.DELETED} }
      };
      const deleteAcount = async() => {
  
        const checkAcount = await Account.count(queryObject);
  
        if (checkAcount < 1) {
          return new CustomError('Invalid Document Id', {
            status: 403
          });
        }
  
  
        const deletedAcount = await Account.update({
          id: AcountId
        }, {
          status_id: Status.DELETED
        }).fetch();
  
        if (deletedAcount)
          return deletedAcount;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteAcount()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
};