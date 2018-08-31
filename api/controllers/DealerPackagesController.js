/**
 * DealerPackagesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  create: async function (req, res) {

    if (!req.param('dealer_id') || !_.isNumber(req.param('dealer_id'))) {
      return res.badRequest("dealer_id required");
    }

    if (!req.param('package_id') || !_.isNumber(req.param('package_id'))) {
      return res.badRequest("package_id required");
    }
    if (!req.param('price') || !_.isNumber(req.param('price'))) {
      return res.badRequest("price required");
    }
    let queryObject = {
      where: {
        dealer: req.param('dealer_id'),
        packages: req.param('package_id'),
      }
    }
    const countDP = await DealerPackages.count(queryObject);
    if (countDP > 0) {
      throw new CustomError('Record already exist.', {
        status: 403
      });
    }
    const process = async () => {

      const newDealerPackages = await DealerPackages.create({
        'dealer': req.param('dealer_id'),
        'packages': req.param('package_id'),
        'price': req.param('price'),
        'status_id': Status.ACTIVE,
        'createdBy': req.token.user.id, // current logged in user id
      }).fetch();

      if (newDealerPackages)
        return newDealerPackages;

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
        sort: 'dealer',
        query: ''
      });

    var sortable = ['dealer'];

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
   
    let queryObject
    if (req.token.user.role.id == 2 ) {
      queryObject = {
        where: { dealer: req.token.user.id, status_id: { '!=': Status.DELETED } },
        // // limit: parseInt(params.per_page),
        // sort: '',
      };
    }
    else if(req.param('dealer_id')){
      queryObject = {
        where: {dealer: parseInt(req.param('dealer_id')), status_id: { '!=': Status.DELETED } },
        // // limit: parseInt(params.per_page),
        // sort: '',
      };
    }
    else{
      queryObject = {
        where: { dealer: req.token.user.id, status_id: { '!=': Status.DELETED } },
        // // limit: parseInt(params.per_page),
        // sort: '',
      };
    }
    // if (params.sort && _.indexOf(sortable, params.sort) > -1) {
    //   queryObject.sort = params.sort + ' ' + params.sort_dir;
    // }
    queryObject.where.or = [{
      // 'dealer': {
      //   'contains': params.query 
      // }
    }];

    const getDealerPackages = async () => {

      const DealerPackages_count = await DealerPackages.count({where: { status_id: { '!=': Status.DELETED } }});
      if (DealerPackages_count < 1) {
        throw new CustomError('DealerPackages not found', {
          status: 403
        });
      }
      let dealerPackages = await DealerPackages.find(queryObject).populate('dealer').populate('packages');
      if (dealerPackages.length < 1) {
        throw new CustomError('DealerPackages not found', {
          status: 403
        });
      }

      const responseObject = {
        dealerPackages: dealerPackages,
        totalCount: DealerPackages_count,
        // perPage: params.per_page,
        // currentPage: params.page
      };
      return responseObject;
    }

    getDealerPackages()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let DealerPackagesId = req.param('id')
    let queryObject = {
      where: { id: DealerPackagesId, }
    };
    const getDealerPackages = async () => {
      let dealerPackages = await DealerPackages.findOne(queryObject).populate('dealer').populate('packages');

      if (dealerPackages)
        return dealerPackages;
      else
        throw new CustomError('DealerPackages not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getDealerPackages()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let DealerPackagesId = req.param('id');

    const updateDealerPackages = async () => {

      const oldDealerPackages = await DealerPackages.count({
        id: DealerPackagesId
      });

      if (oldDealerPackages < 1) {
        throw new CustomError('Invalid DealerPackages  Id', {
          status: 403
        });
      }

      let dealerPackages = {};

      if (req.param('dealer_id') != undefined && _.isNumber(req.param('dealer_id'))) {
        dealerPackages.dealer = req.param('dealer_id');
      }
      if (req.param('package_id') != undefined && _.isNumber(req.param('package_id'))) {
        dealerPackages.packages = req.param('package_id');
      }
      if (req.param('price') != undefined && _.isNumber(req.param('price'))) {
        dealerPackages.price = req.param('price');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        dealerPackages.status_id = req.param('status_id');
      }


      const updatedDealerPackages = await DealerPackages.update({
        id: DealerPackagesId
      }, dealerPackages).fetch();

      if (updatedDealerPackages)
        return updatedDealerPackages;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateDealerPackages()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("id is required");
    }
    let DealerPackagesId = req.param('id');
    let queryObject = {
      where: { id: DealerPackagesId }
    };
    const deleteDealerPackages = async () => {

      const checkDealerPackages = await DealerPackages.count(queryObject);

      if (checkDealerPackages < 1) {
        throw new CustomError('Invalid DealerPackages Id', {
          status: 403
        });
      }


      const deletedDealerPackages = await DealerPackages.destroy({
        id: DealerPackagesId
      }).fetch();

      if (deletedDealerPackages !== 0)
        return 'deleted successfully';
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }
    deleteDealerPackages()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};
