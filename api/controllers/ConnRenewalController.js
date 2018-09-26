/**
 * ConnRenewalController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
module.exports = {

  create: async function (req, res) {

    if (!req.param('connection_id') || !_.isNumber(req.param('connection_id'))) {
      return res.badRequest("connection_id required");
    }
    let count_connection = await Connection.count({ id: req.param('connection_id'), status_id: { '!=': Status.DELETED } });
    if (count_connection < 1)
      return res.badRequest("invalid connection id");

    let queryObject = {
      where: { connection: req.param('connection_id'), status_id: { '!=': Status.DELETED } },
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
      // if (!req.param('activation_date')) {
      //   return res.badRequest("activation_date required");
      // }
      activation_date = moment();
      expiration_date = moment(activation_date).add(1, 'M');
      let connection = await Connection.findOne({ id: req.param('connection_id') }).populate('packages');
      if (connection.packages)
        cost_price = connection.packages.cost_price;
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
        'connection': req.param('connection_id'),
        'user': req.token.user.id,
        'createdBy': req.token.user.id
      }).fetch();

      if (newConnRenewal){
           await sails.helpers.makeConnectionPayment(newConnRenewal.id, newConnRenewal.connection, newConnRenewal.renewal_price , newConnRenewal.cost_price ,newConnRenewal.createdBy)
                .intercept('error', () => {
                  ConnRenewal.destroy({ id: newConnRenewal.id });
                  throw new CustomError('error while connection recharge.', {
                    status: 403
                  });
                });
          
        return newConnRenewal;
      }
      throw new CustomError('Some error occurred. Please contact support team for help. ');
    }

    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  rechargeConnection: async function (req, res) {
   
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');

    let ConnRenewalId = req.param('id');
    const updateConnRenewal = async () => {

      const oldConnRenewal = await ConnRenewal.count({
        id: ConnRenewalId, status_id: Status.PAID
      });

      if (oldConnRenewal < 1) {
        throw new CustomError('Invalid ConnRenewal  Id', {
          status: 403
        });
      }

      let connRenewal = {
        status_id: Status.ACTIVE,
      };



      const updatedConnRenewal = await ConnRenewal.update({
        id: ConnRenewalId
      }, connRenewal).fetch();

      if (updatedConnRenewal) {
        // await sails.helpers.makeConnectionPayment(ConnRenewalId, updateConnRenewal[0].connection, req.token.user.id)
        //         .intercept('error', () => {
        //            ConnRenewal.update({
        //             id: ConnRenewalId
        //           }, {status_id: Status.PAID});
        //           throw new CustomError('error while connection recharge.', {
        //             status: 403
        //           });
        //         });
        return 'Recharged successfully'
      }

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  changePackage: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');

    const changePackage = async () => {
      // const queryObjectStatus = {
      //   where: { connection: ConnectionId, status_id: { '!=': Status.DELETED } }
      // };
      // const checkStatus = await ConnRenewal.count(queryObjectStatus);

      // const changePackageC = await Connection.update({
      //   id: ConnectionId
      // }, {
      //     status_id: checkStatus > 1 ? Status.ACTIVE : Status.PENDING
      //   }).fetch();
      const conn = await Connection.findOne({ id: ConnectionId });
      const invoiceCount = await Invoices.count({ customers: conn.customers , paid:true , status_id:Status.ACTIVE });
        const changePackageC = await Connection.update({
            id: conn.id
          }, {
              status_id: invoiceCount > 0 ? Status.ACTIVE:Status.PENDING,
            }).fetch();
      if (changePackageC.length > 0) {
        return 'Package Updated Successfully.'
      }
      else {
        throw new CustomError('Error while package updation.', {
          status: 403
        });
      }
    }
    changePackage()
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
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let connRenewal = await ConnRenewal.find(queryObject).populate('connection');;
      if (!connRenewal) {
        throw new CustomError('connRenewal not found', {
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
      where: { status_id: [Status.PAID, Status.PENDING], },
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


      const connRenewal = await ConnRenewal.find(queryObject);
      if (connRenewal.length < 1) {
        return connRenewal;
      }

      // new code
      const connection = await Connection.findOne({
        id: connRenewal[0].connection,
        status_id: { nin: [Status.DELETED, Status.IN_REVIEW] },
        doc_verified: true,
      }).populate('customers').populate('new_package').populate('packages')
        .populate('salesman').populate('dealer');
      if (!connection) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      connection.connRenewalId = connRenewal[0].id;
      await Connection.update({
        id: connection.id
      }, {
          status_id: Status.IN_REVIEW
        });
      var CronJob = require('cron').CronJob;
      let connectionReview = new CronJob({
        cronTime: '* * * * *', //'* * * * *',
        onTick: async function () {
          // console.log('crop job started in connection');
          const conn = await Connection.findOne({ id: connection.id });
          if (conn.status_id == Status.IN_REVIEW) {
            await Connection.update({
              id: connection.id
            }, {
                status_id: connection.status_id
              });
          }
          connectionReview.stop();
          // console.log('cron job stopped');
        },
        start: false,
        timeZone: 'America/Los_Angeles'
      });
      connectionReview.start();
      return connection;

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
        sort_dir: 'ASC',
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
        throw new CustomError('ConnRenewal not found', {
          status: 403
        });
      }


      const connRenewal = await ConnRenewal.find(queryObject).populate('connection');
      if (!connRenewal) {
        throw new CustomError('connRenewal not found', {
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
      if (connRenewal[0].connection != null) {

        const customer = await Customers.findOne(connRenewal[0].connection.customers);
        if (customer) {
          data.client_name = customer.first_name;
          data.contact = customer.mobile;
        }



        const user = await User.findOne(connRenewal[0].connection.dealer);
        if (user) {
          data.area_dealer = user.first_name;
        }
        const package = await Packages.findOne(connRenewal[0].connection.packages);
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
        sort_dir: 'ASC',
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
    let connection;
    // console.log('in fun' , req.token.user)
    if (req.token.user.role.id == 2) {
      connection = await Connection.find(
        {
          where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
          select: ['id']
        },
      );
    }

    let arrObj = [];
    let connRenewal;
    const getConnRenewal = async () => {

      const ConnRenewal_count = await ConnRenewal.count({ 
          where: { status_id: { '!=': Status.DELETED } } });
      if (!ConnRenewal_count) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      if (req.token.user.role.id == 2) {
        for (const c of connection) {
          let connRenewalFN = await ConnRenewal.find({
            where: { status_id: { '!=': Status.DELETED }, connection: c.id },
            sort:['expiration_date DESC']
          }).populate('connection');
          if (connRenewalFN.length >= 1) {
            for (const conn of connRenewalFN) {
              arrObj.push(conn);
            }
          }

        }
      }
      else {
        connRenewal = await ConnRenewal.find(queryObject).populate('connection');
        if (!connRenewal) {
          throw new CustomError('connRenewal not found', {
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
        data.expiration_date = moment(cr.expiration_date).format('MM/DD/YYYY');
        if (cr.connection != null) {

          const customer = await Customers.findOne(cr.connection.customers);
          if (customer) {
            data.client_name = customer.first_name;
            data.contact = customer.mobile;
          }



          const user = await User.findOne(cr.connection.dealer);
          if (user) {
            data.area_dealer = user.first_name;
          }
          const package = await Packages.findOne(cr.connection.new_package);
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
      let connRenewal = await ConnRenewal.findOne(queryObject).populate('connection');

      if (connRenewal) {
        return _.omit(connRenewal, ['cost_price']);
      }
      else
        throw new CustomError('ConnRenewal not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
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
        throw new CustomError('Invalid ConnRenewal  Id', {
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
        connRenewal.connection = req.param('connection_id');
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
      throw new CustomError('Some error occurred. Please contact development team for help.', {
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
        throw new CustomError('Invalid ConnRenewal Id', {
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
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};