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
    let billing_date;
    let cost_price;
    let is_advance;
    let serial_number;
    let connection = await Connection.findOne({ id: req.param('connection_id') }).populate('packages');
    let connRenewal = await ConnRenewal.find(queryObject);
    if (connRenewal.length >= 1) {
      // console.log(moment.utc(connRenewal[0].updatedAt).format('MM/DD/YYYY') , moment().format('MM/DD/YYYY'))
      if(moment.utc(connRenewal[0].updatedAt).format('MM/DD/YYYY') == moment().format('MM/DD/YYYY'))
      {
        return res.badRequest({err:"cannot renew a connection on the same day"});
      }
      if (connection.status_id == Status.EXPIRED) {
        activation_date = moment(connRenewal[0].expiration_date);
        expiration_date = moment(connRenewal[0].expiration_date).add(1, 'M').subtract(1, 'd');
        billing_date = moment(connRenewal[0].expiration_date).add(1, 'M');

        is_advance = false;
      }
      else if (connection.status_id == Status.TERMINATED) {
        activation_date = moment();
        expiration_date = moment(activation_date).add(1, 'M').subtract(1, 'd');
        billing_date = moment(connRenewal[0].expiration_date).add(1, 'M');
        is_advance = false;

      }
      else {
        activation_date = moment(connRenewal[0].expiration_date);
        billing_date = moment(connRenewal[0].expiration_date).add(1, 'M');
        expiration_date = moment(connRenewal[0].expiration_date).add(1, 'M').subtract(1, 'd');
        // serial_number = await ConnRenewal.query('SELECT serial_number from ConnRenewal ORDER BY serial_number DESC LIMIT 1');
        let queryResult = await sails.sendNativeQuery('SELECT serial_number from connrenewal ORDER BY serial_number DESC LIMIT 1', []);
        if (queryResult.rows[0].serial_number == null) {
          serial_number = 5000;
        }
        else {
          serial_number = queryResult.rows[0].serial_number + 1;
        }
        is_advance = true;

      }
      cost_price = connRenewal[0].cost_price;
    }
    else {

      activation_date = moment();
      billing_date = moment(activation_date).add(1, 'M');
      expiration_date = moment(activation_date).add(1, 'M').subtract(1 , 'd');
      is_advance = true;
      if (connection.packages)
        cost_price = connection.packages.cost_price;
    }


    const process = async () => {
      let newConnRenewal = await ConnRenewal.create({
        'activation_date': activation_date.toDate(),
        'expiration_date': expiration_date.toDate(),
        'billing_date' : billing_date.toDate(),
        'renewal_price': req.param('renewal_price'),
        'cost_price': cost_price,
        'serial_number': serial_number,
        'status_id': Status.PAID,
        'is_advance': is_advance,
        'connection': req.param('connection_id'),
        'packages': req.param('package'),
        'createdBy': req.token.user.id
      }).fetch();

      if (newConnRenewal) {
        await sails.helpers.makeConnectionPayment(newConnRenewal.connection, newConnRenewal.renewal_price,
          newConnRenewal.cost_price, connection.dealer == 1 ? 1 : 3, newConnRenewal.createdBy)
          .intercept('error', () => {
            ConnRenewal.destroy({ id: newConnRenewal.id });
            throw new CustomError('error while connection recharge.', {
              status: 403
            });
          });
        const packagePrices = await sails.helpers.getPackagePrices(req.param('package') , connection.dealer);
        const invoice = await Invoices.create({
          'customers': connection.customers,
          'total_price': packagePrices.retail_price,
          'paid_amount': 0,
          'status_id': Status.PAID,
          'paid': false,
          'user_remarks': 'Invoice created through connection renewal.',
          'createdBy': connection.createdBy, // current logged in user id
        }).fetch();
        newConnRenewal.invoice = invoice.id;
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
        id: ConnRenewalId, status_id: { in: [Status.PAID, Status.UNPAID ,Status.PENDING ] }
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

      if (updatedConnRenewal.length > 0) {
        await Connection.update({
          id: updatedConnRenewal[0].connection , status_id:{'!=': Status.ACTIVE}
        }, { status_id: Status.ACTIVE });
        // await sails.helpers.makeConnectionPayment( updateConnRenewal[0].connection, req.token.user.id)
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

      const conn = await Connection.findOne({ id: ConnectionId });

      const changePackageC = await Connection.update({
        id: conn.id
      }, {
          status_id: Status.ACTIVE,
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
      where: {
        status_id: [Status.PAID, Status.UNPAID , Status.PENDING],
        is_advance: params.is_advance == '1' ? true : false
      },
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
        status_id: { in: [Status.ACTIVE , Status.REGISTERED , Status.TERMINATED , Status.EXPIRED], nin: [Status.DELETED, Status.IN_REVIEW] },
        doc_verified: true,
        in_review: false
      }).populate('customers').populate('packages')
        .populate('salesman').populate('dealer');
      if (!connection) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let countConn = await ConnRenewal.count({ where: { status_id: [Status.PAID, Status.PENDING, Status.UNPAID], } });
      connection.connrenewal = connRenewal[0];
      await Connection.update({
        id: connection.id
      }, {
          in_review: true
        });
      var CronJob = require('cron').CronJob;
      let connectionReview = new CronJob({
        cronTime: '* * * * *', //'* * * * *',
        onTick: async function () {
          // console.log('crop job started in connection');
          const conn = await Connection.findOne({ id: connection.id });
          if (conn.in_review) {
            await Connection.update({
              id: connection.id
            }, {
                in_review: false
              });
          }
          connectionReview.stop();
          // console.log('cron job stopped');
        },
        start: false,
        timeZone: 'America/Los_Angeles'
      });
      connectionReview.start();
      response = {
        connection: connection,
        count: countConn,
      }
      return response;

    }

    getConnRenewal()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  connectionToRenew: function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'ASC',
        sort: 'id',
        query: ''
      });

    var sortable = ['id'];

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
    if (req.token.user.role.id == 2) {
      queryObject = {
        where: { doc_verified: true, 
          requested_status_id: { nin: [Status.INACTIVE] },
          status_id: { in: [Status.ACTIVE, Status.EXPIRED, Status.TERMINATED] }, dealer: req.token.user.id },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    else {
      queryObject = {
        where: { doc_verified: true, 
          requested_status_id: { nin: [Status.INACTIVE] },
          status_id: { in: [Status.ACTIVE, Status.EXPIRED, Status.TERMINATED] } },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }


    // if(params.doc == '1'){
    //   queryObject.select = ['customers'];
    // }
    // console.log(params, queryObject.where.or , params.query);

    queryObject.select = ['id', 'connection_price','packages', 'address'];


    const getConnection = async () => {

      const Connection_count = await Connection.count({ where: { status_id: { in: [Status.ACTIVE, Status.PACKAGE_UPDATED] } } });
      if (Connection_count < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let connection = await Connection.find(queryObject).populate('customers').populate('packages')
        .populate('dealer').populate('connRenewal', { where: { status_id: Status.PAID }, sort: 'expiration_date DESC' });
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let connectionArr = [];
      for (const c in connection) {
        // console.log(c);
        if (connection[c].connRenewal.length < 1) {
          // let index = connection.indexOf[c];
          // console.log('remove',c);
          // connection.splice(c+1, 1);
          connectionArr.push(connection[c]);
        }
      }
      // console.log(connection.length);

      const responseObject = {
        connection: connectionArr,
        totalCount: Connection_count,
        perPage: params.per_page,
        currentPage: params.page
      };
      return responseObject;
    }

    getConnection()
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
        sort: 'id',
        query: ''
      });

    var sortable = ['id'];

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
      where: { status_id: { nin: [Status.DELETED] }, 
      dealer: req.token.user.role.id == 2 ? req.token.user.id : undefined
      },
      sort: '',
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'address': {
        'like': '%' + params.query + '%'
      },
    }];

    const getConnRenewal = async () => {

      // const ConnRenewal_count = await Connection.count({ status_id: { '!= ': Status.DELETED}});
      // if (!ConnRenewal_count) {
      //   throw new CustomError('Connectiion not found', {
      //     status: 403
      //   });
      // }


      const connection = await Connection.find(queryObject).populate('connRenewal' , 
      {sort: 'billing_date DESC' , limit:1}
      ).populate('packages').populate('dealer').populate('customers');
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      let connRenewalArr = [];
      for(const c of connection){
        let data = {};
        data.id = c.connRenewal[0].id;
        data.activation_date = moment(c.connRenewal[0].activation_date).format('MM/DD/YYYY');
        data.expiration_date = moment(c.connRenewal[0].expiration_date).format('MM/DD/YYYY');
        data.billing_date = moment(c.connRenewal[0].billing_date).format('MM/DD/YYYY');
        data.client_name = c.customers.first_name;
        data.contact = c.customers.mobile;
        data.area_dealer = c.dealer.first_name;
        data.package = c.packages.package_name;
        connRenewalArr.push(data);
      }
      // const connRenewal = await ConnRenewal.find({where:{id:{in: connRenewalArr}}});
      // if (connRenewal.length < 1) {
      //   throw new CustomError('connRenewal not found', {
      //     status: 403
      //   });
      // }
      return connRenewalArr;
      
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
        where: { status_id: { '!=': Status.DELETED } }
      });
      if (!ConnRenewal_count) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      if (req.token.user.role.id == 2) {
        for (const c of connection) {
          let connRenewalFN = await ConnRenewal.find({
            where: { status_id: { '!=': Status.DELETED }, connection: c.id },
            sort: ['expiration_date DESC']
          }).populate('connection').populate('packages');
          if (connRenewalFN.length >= 1) {
            for (const conn of connRenewalFN) {
              arrObj.push(conn);
            }
          }

        }
      }
      else {
        connRenewal = await ConnRenewal.find(queryObject).populate('connection').populate('packages');
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
          data.package = cr.packages.package_name;

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
        connRenewal.expiration_date = moment(req.param('expiration_date')).subtract(1 , 'd').toDate();
      }
      if (req.param('billing_date') != undefined) {
        connRenewal.billing_date = moment(req.param('billing_date')).toDate();
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