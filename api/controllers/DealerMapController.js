/**
 * DealerMapController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {

  create: function (req, res) {

    // console.log(req.body);
    if (!req.param('coordinates') || !_.isArray(req.param('coordinates'))) {
      return res.badRequest("coordinate required");
    }
    // const coordinates = JSON.stringify(req.param('coordinate'));
    if (!req.param('dealer_id') || !_.isNumber(req.param('dealer_id'))) {
      return res.badRequest("dealer_id required");
    }

    const process = async () => {

        const newDealerMap = await DealerMap.create({
          'coordinate': req.param('coordinates'),
          'dealer': req.param('dealer_id'),
          'status_id': Status.ACTIVE,
        }).fetch();

        if (newDealerMap)
          return newDealerMap;

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
        sort: 'coordinate',
        query: ''
      });

    var sortable = ['coordinate'];

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
      // // limit: parseInt(params.per_page),
      // sort: '',
    };
    //   if (params.sort && _.indexOf(sortable, params.sort) > -1) {
    //     queryObject.sort = params.sort + ' ' + params.sort_dir;
    //   }
    queryObject.where.or = [{
      // 'coordinate': {
      //   'like': '%' + params.query + '%'
      // },
      // dealer: params.query,
    }];




    const getDealerMap = async () => {

      const DealerMap_count = await DealerMap.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (!DealerMap_count) {
        return new CustomError('dealerMap not found', {
          status: 403
        });
      }
      // console.log(queryObject);
      let dealerMap = await DealerMap.find(queryObject).populate('dealer');;
      if (!dealerMap) {
        return new CustomError('dealerMap not found', {
          status: 403
        });
      }
      const responseObject = {
        dealerMap: dealerMap,
        totalCount: DealerMap_count,
        //   perPage: params.per_page,
        //   currentPage: params.page
      };
      return responseObject;
    }

    getDealerMap()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let DealerMapId = req.param('id')
    let queryObject = {
      where: { dealer: DealerMapId, status_id: { '!=': Status.DELETED } }
    };
    const getDealerMap = async () => {
      let dealerMap = await DealerMap.find(queryObject).populate('dealer');

      if (dealerMap)
        return dealerMap;
      else
        return new CustomError('DealerMap not found', {
          status: 403
        });

      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getDealerMap()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let DealerMapId = req.param('id');

    const updateDealerMap = async () => {

      const oldDealerMap = await DealerMap.count({
        id: DealerMapId
      });

      if (oldDealerMap < 1) {
        return new CustomError('Invalid DealerMap  Id', {
          status: 403
        });
      }

      let dealerMap = {};

      if (req.param('coordinate') != undefined && _.isArray(req.param('coordinate'))) {
        dealerMap.coordinate = req.param('coordinate');
      }
      if (req.param('dealer_id') != undefined && _.isNumber(req.param('dealer_id'))) {
        dealerMap.dealer = req.param('dealer_id');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        dealerMap.status_id = req.param('status_id');
      }


      const updatedDealerMap = await DealerMap.update({
        id: DealerMapId
      }, dealerMap).fetch();

      if (updatedDealerMap)
        return updatedDealerMap;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateDealerMap()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let DealerMapId = req.param('id');
    let queryObject = {
      where: { id: DealerMapId, status_id: { '!=': Status.DELETED } }
    };
    const deleteDealerMap = async () => {

      const checkDealerMap = await DealerMap.count(queryObject);

      if (checkDealerMap < 1) {
        return new CustomError('Invalid DealerMap Id', {
          status: 403
        });
      }


      const deletedDealerMap = await DealerMap.update({
        id: DealerMapId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedDealerMap)
        return deletedDealerMap;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteDealerMap()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  },
  deleteAll: function (req, res) {

    const deleteDealerMap = async () => {


      const deletedDealerMap = await DealerMap.destroy({

      }).fetch();


      if (deletedDealerMap)
        return 'Deleted all data successfully';
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteDealerMap()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }

};
