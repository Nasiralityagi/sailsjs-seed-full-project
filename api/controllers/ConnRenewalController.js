/**
 * ConnRenewalController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
module.exports = {

  create: async function (req, res) {

    // if (!req.param('activation_date')) {
    //   return res.badRequest("activation_date required");
    // }

    if (!req.param('connection_id') || !_.isNumber(req.param('connection_id'))) {
      return res.badRequest("connection_id required");
    }
    let count_connection = await UserConnection.count({ id: req.param('connection_id'), status_id: { '!=': Status.DELETED } });
    if (count_connection < 1)
      return res.badRequest("invalid userconnection id");

    let queryObject = {
      where: { userconnection: req.param('connection_id'), status_id: { '!=': Status.DELETED } },
      sort: ['expiration_date DESC'],
      limit: 1,
    };
    let expiration_date;
    let activation_date;
    let cost_price;
    let connRenewal = await ConnRenewal.find(queryObject);
    if (connRenewal.length >= 1) {
      activation_date = moment(connRenewal[0].activation_date);
      expiration_date = moment(connRenewal[0].expiration_date).add(1, 'M');
      cost_price = connRenewal[0].cost_price;
    }
    else {
      if (!req.param('activation_date')) {
        return res.badRequest("activation_date required");
      }

      activation_date = moment(req.param('activation_date'));
      expiration_date = moment(activation_date).add(1, 'M');
      let userconnection = await UserConnection.findOne({ id: req.param('connection_id') }).populate('packages');
      if (userconnection.packages)
        cost_price = userconnection.packages.cost_price;
    }



    // var momentObj = moment(req.param('activation_date')).format('MM/DD/YYYY');
    // var dateObj = new Date(momentObj);
    // console.log(momentObj);
    // return res.json(momentObj);
    const process = async () => {
      const newConnRenewal = await ConnRenewal.create({
        'activation_date': activation_date.toDate(),
        'expiration_date': expiration_date.toDate(),
        'renewal_price': req.param('renewal_price'),
        'cost_price': cost_price,
        'status_id': Status.PAID,
        'userconnection': req.param('connection_id'),
        'user': req.token.user.id
      }).fetch();

      if (newConnRenewal)
        return newConnRenewal;

      throw new CustomError('Some error occurred. Please contact support team for help. ');
    }

    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  activeConnection: async function (req, res) {
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let ConnRenewalId = req.param('id');
    const updateConnRenewal = async () => {

      const oldConnRenewal = await ConnRenewal.count({
        id: ConnRenewalId
      });

      if (oldConnRenewal < 1) {
        return new CustomError('Invalid ConnRenewal  Id', {
          status: 403
        });
      }

      let connRenewal = {
        status_id: Status.ACTIVE,
      };



      const updatedConnRenewal = await ConnRenewal.update({
        id: ConnRenewalId
      }, connRenewal).fetch();

      if (updatedConnRenewal)
        return { msg: 'Activated successfully' };
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateConnRenewal()
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
        sort: 'activation_date',
        query: ''
      });

    var sortable = ['activation_date'];

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
      'activation_date': {
        'like': '%' + params.query + '%'
      }
    }];




    const getConnRenewal = async () => {

      const ConnRenewal_count = await ConnRenewal.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (!ConnRenewal_count) {
        return new CustomError('document not found', {
          status: 403
        });
      }
      let connRenewal = await ConnRenewal.find(queryObject).populate('userconnection');;
      if (!connRenewal) {
        return new CustomError('connRenewal not found', {
          status: 403
        });
      }
      let result = [];
      for (let c of connRenewal) {
        result.push(_.omit(c, ['cost_price']));
      }
      const responseObject = {
        connRenewal: result,
        totalCount: ConnRenewal_count,
        perPage: params.per_page,
        currentPage: params.page
      };
      return responseObject;
    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  paidConnection: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'DESC',
        sort: 'expiration_date',
        query: ''
      });

    var sortable = ['expiration_date'];

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
      where: { status_id: Status.PAID },
      // limit: parseInt(params.per_page),
      sort: '',
      limit: 1
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'expiration_date': {
        'like': '%' + params.query + '%'
      },
    }];

    const getConnRenewal = async () => {

      const ConnRenewal_count = await ConnRenewal.count({ where: { status_id: 18 } });
      if (!ConnRenewal_count) {
        return new CustomError('ConnRenewal not found', {
          status: 403
        });
      }


      const connRenewal = await ConnRenewal.find(queryObject).populate('userconnection');
      if (!connRenewal) {
        return new CustomError('connRenewal not found', {
          status: 403
        });
      }


      let data = {
        // client_name: '',
        // area_dealer: '',
        // activation_date: '',
        // contact: '',
        // package: '',
      }
      data.id = connRenewal[0].id;
      data.activation_date = moment(connRenewal[0].activation_date).format('MM/DD/YYYY');
      data.expiration_date = moment(connRenewal[0].expiration_date).format('MM/DD/YYYY');
      if (connRenewal[0].userconnection != null) {

        const customer = await Customers.findOne(connRenewal[0].userconnection.customers);
        if (customer) {
          data.client_name = customer.first_name;
          data.contact = customer.mobile;
        }



        const user = await User.findOne(connRenewal[0].userconnection.dealer);
        if (user) {
          data.area_dealer = user.first_name;
        }
        const package = await Packages.findOne(connRenewal[0].userconnection.packages);
        if (package) {
          data.package = package.package_name;
        }

      }

      return data;
    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  expiredConnection: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'DESC',
        sort: 'expiration_date',
        query: ''
      });

    var sortable = ['expiration_date'];

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
      where: { status_id: Status.PAID },
      // limit: parseInt(params.per_page),
      sort: '',
      limit: 1
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'expiration_date': {
        'like': '%' + params.query + '%'
      },
    }];

    const getConnRenewal = async () => {

      const ConnRenewal_count = await ConnRenewal.count({ where: { status_id: 18 } });
      if (!ConnRenewal_count) {
        return new CustomError('ConnRenewal not found', {
          status: 403
        });
      }


      const connRenewal = await ConnRenewal.find(queryObject).populate('userconnection');
      if (!connRenewal) {
        return new CustomError('connRenewal not found', {
          status: 403
        });
      }


      let data = {
        // client_name: '',
        // area_dealer: '',
        // activation_date: '',
        // contact: '',
        // package: '',
      }
      data.id = connRenewal[0].id;
      data.activation_date = moment(connRenewal[0].activation_date).format('MM/DD/YYYY');
      data.expiration_date = moment(connRenewal[0].expiration_date).format('MM/DD/YYYY');
      if (connRenewal[0].userconnection != null) {

        const customer = await Customers.findOne(connRenewal[0].userconnection.customers);
        if (customer) {
          data.client_name = customer.first_name;
          data.contact = customer.mobile;
        }



        const user = await User.findOne(connRenewal[0].userconnection.dealer);
        if (user) {
          data.area_dealer = user.first_name;
        }
        const package = await Packages.findOne(connRenewal[0].userconnection.packages);
        if (package) {
          data.package = package.package_name;
        }

      }

      return data;
    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findData: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'DESC',
        sort: 'activation_date',
        query: ''
      });

    var sortable = ['activation_date'];

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
    let queryObject;
    if (params.status_id) {
      queryObject = {
        where: { status_id: parseInt(params.status_id) },
        // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    else {
      queryObject = {
        where: { status_id: { '!=': Status.DELETED } },
        // limit: parseInt(params.per_page),
        sort: '',
      };
    }

    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'activation_date': {
        'like': '%' + params.query + '%'
      },
    }];
    let userconnection;
    // console.log('in fun' , req.token.user)
    if (req.token.user.role.id == 2) {
      userconnection = await UserConnection.find(
        {
          where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
          select: ['id']
        },
      );
    }

    let arrObj = [];
    let connRenewal;
    const getConnRenewal = async () => {

      const ConnRenewal_count = await ConnRenewal.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (!ConnRenewal_count) {
        return new CustomError('document not found', {
          status: 403
        });
      }

      if (req.token.user.role.id == 2) {
        for (const c of userconnection) {
          let connRenewalFN = await ConnRenewal.findOne({
            where: { status_id: { '!=': Status.DELETED }, userconnection: c.id }
          }).populate('userconnection');
          if (connRenewalFN) {
            arrObj.push(connRenewalFN);
          }

        }
      }
      else {
        connRenewal = await ConnRenewal.find(queryObject).populate('userconnection');
        if (!connRenewal) {
          return new CustomError('connRenewal not found', {
            status: 403
          });
        }
      }


      // return res.json(connRenewal);
      let dataArray = [];
      for (const cr of connRenewal || arrObj) {
        let data = {
          // client_name: '',
          // area_dealer: '',
          // activation_date: '',
          // contact: '',
          // package: '',
        }
        data.id = cr.id;
        data.activation_date = moment(cr.activation_date).format('MM/DD/YYYY');
        if (cr.userconnection != null) {

          const customer = await Customers.findOne(cr.userconnection.customers);
          if (customer) {
            data.client_name = customer.first_name;
            data.contact = customer.mobile;
          }



          const user = await User.findOne(cr.userconnection.dealer);
          if (user) {
            data.area_dealer = user.first_name;
          }
          const package = await Packages.findOne(cr.userconnection.packages);
          if (package) {
            data.package = package.package_name;
          }
          dataArray.push(data);
        }



      }
      const responseObject = {
        dataArray: dataArray,
        totalCount: ConnRenewal_count,
        perPage: params.per_page,
        currentPage: params.page
      };
      return responseObject;
    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let ConnRenewalId = req.param('id');
    let queryObject = {
      where: { id: ConnRenewalId, status_id: { '!=': Status.DELETED } }
    };
    const getConnRenewal = async () => {
      let connRenewal = await ConnRenewal.findOne(queryObject).populate('userconnection');

      // var dateString = moment.unix(value).format("MM/DD/YYYY");
      if (connRenewal) {
        // var dateString = new Date(connRenewal.createdAt*1000);
        // var dateString =  moment.utc(connRenewal.createdAt).format('MM/DD/YYYY');
        // console.log(connRenewal.createdAt);
        // let dateString = moment(connRenewal.createdAt).format('L');
        // console.log(dateString)
        // const unixdate =  parseInt((new Date('2012.08.10').getTime() / 1000)); //.toFixed(0))
        // var unixdate = moment('2012.08.10', 'YYYY.MM.DD').unix();
        // var dateString = moment.unix(connRenewal.createdAt).format("MM/DD/YYYY");
        // console.log(unixdate)
        //  dateString = moment(unixdate*1000).format('L');

        //  dateString =  moment.utc(unixdate).format('MM/DD/YYYY');
        //  console.log(dateString)
        return _.omit(connRenewal, ['cost_price']);
      }
      else
        return new CustomError('ConnRenewal not found', {
          status: 403
        });

      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let ConnRenewalId = req.param('id');

    const updateConnRenewal = async () => {

      const oldConnRenewal = await ConnRenewal.count({
        id: ConnRenewalId
      });

      if (oldConnRenewal < 1) {
        return new CustomError('Invalid ConnRenewal  Id', {
          status: 403
        });
      }

      let connRenewal = {};

      if (req.param('activation_date') != undefined) {
        connRenewal.activation_date = moment(req.param('activation_date')).toDate();
      }
      if (req.param('expiration_date') != undefined) {
        connRenewal.expiration_date = moment(req.param('expiration_date')).toDate();
      }
      if (req.param('connection_id') != undefined && _.isNumber(req.param('connection_id'))) {
        connRenewal.userconnection = req.param('connection_id');
      }
      if (req.param('renewal_price') != undefined && _.isNumber(req.param('renewal_price'))) {
        connRenewal.renewal_price = req.param('renewal_price');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        connRenewal.status_id = req.param('status_id');
      }


      const updatedConnRenewal = await ConnRenewal.update({
        id: ConnRenewalId
      }, connRenewal).fetch();

      if (updatedConnRenewal)
        return updatedConnRenewal;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnRenewalId = req.param('id');
    let queryObject = {
      where: { id: ConnRenewalId, status_id: { '!=': Status.DELETED } }
    };
    const deleteConnRenewal = async () => {

      const checkConnRenewal = await ConnRenewal.count(queryObject);

      if (checkConnRenewal < 1) {
        return new CustomError('Invalid ConnRenewal Id', {
          status: 403
        });
      }


      const deletedConnRenewal = await ConnRenewal.update({
        id: ConnRenewalId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedConnRenewal)
        return deletedConnRenewal;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};