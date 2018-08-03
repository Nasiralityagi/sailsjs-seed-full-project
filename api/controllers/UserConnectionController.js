/**
 * UserConnectionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');

module.exports = {

  create: function (req, res) {


    if (!req.param('customers') || !_.isNumber(req.param('customers'))) {
      return res.badRequest("customers required");
    }
    if (!req.param('packages') || !_.isNumber(req.param('packages'))) {
      return res.badRequest("package_id required");
    }


    const process = async () => {

      const newConnection = await UserConnection.create({
        'address': req.param('address'),
        'router_of': req.param('router_of') ,//== 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER,
        'router_brand': req.param('router_brand'),
        'router_model': req.param('router_model'),
        'router_price': req.param('router_price'),
        'drop_wire_of': req.param('drop_wire_of') ,// == 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER,
        'drop_wire_length': req.param('drop_wire_length'),
        'price_per_meter': req.param('price_per_meter'),
        'is_wireless': req.param('is_wireless'),
        'lat': req.param('lat'),
        'lng': req.param('lng'),
        'customers': req.param('customers'),
        'packages': req.param('packages'),
        'basestation': req.param('basestation_id'),
        'salesman': req.param('salesman_id'),
        'dealer': req.token.user.id,
        'username': req.param('username'),
        'password': req.param('password'),
        'connection_price': req.param('connection_price'),
        // 'registration_date': Date.now,
        'installed_by': req.param('installed_by'),
        'status_id': Status.PENDING,
      }).fetch();

      // const newConnection = await UserConnection.create({
      //   'address': 'sdfsdfs',
      //   'router_of': 1 ,//== 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER,
      //   'router_brand': '232',
      //   'router_model': '21',
      //   'router_price': 324234,
      //   'drop_wire_of': 0 ,// == 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER,
      //   'drop_wire_length': 2312,
      //   'price_per_meter': 323,
      //   'is_wireless': 1,
      //   'lat': '1231',
      //   'lng': '232',
      //   'customers': 1,
      //   'packages': 1,
      //   'basestation': 1,
      //   'salesman': 1,
      //   'dealer': 1,
      //   'username':'21',
      //   'password': '232',
      //   'connection_price': 233232,
      //   // 'registration_date': Date.now,
      //   'installed_by': 1,
      //   'status_id': Status.PENDING,
      // }).fetch();
      if (newConnection)
        return newConnection;

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
        where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    else {
      queryObject = {
        where: { status_id: { '!=': Status.DELETED } },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'router_price': {
        'like': '%' + params.query + '%'
      }
    }];




    const getConnection = async () => {

      const Connection_count = await UserConnection.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (!Connection_count) {
        return new CustomError('userconnection not found', {
          status: 403
        });
      }
      let userconnection = await UserConnection.find(queryObject).populate('customers').populate('basestation').populate('packages')
        .populate('salesman').populate('dealer');
      if (!userconnection) {
        return new CustomError('userconnection not found', {
          status: 403
        });
      }
      const responseObject = {
        userconnection: userconnection,
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
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId, status_id: { '!=': Status.DELETED } }
    };
    const getConnection = async () => {
      let userconnection = await UserConnection.findOne(queryObject).populate('customers')
        .populate('basestation').populate('packages')
        .populate('salesman').populate('dealer');

      if (userconnection)
        return userconnection;
      else
        return new CustomError('UserConnection not found', {
          status: 403
        });

      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  fileUpload: async function (req, res) {
    if (!req.param('id')) {
      return res.badRequest("Id is required");
    }
    if (!req.param('file_name') || !_.isString(req.param('file_name'))) {
      return res.badRequest("file_name required");
    }
    let connectionId = req.param('id');
    let file_name = req.param('file_name');
    let file = req.file('image');
    const oldConnection = await UserConnection.count({
      id: connectionId
    });

    

    if (oldConnection < 1) {
      return new CustomError('Invalid Customer  Id', {
        status: 403
      });
    }
    const result = await util.fileUpload('userconnection', connectionId, file_name, file);
    return res.json(result);

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let ConnectionId = req.param('id');

    const updateConnection = async () => {

      const oldConnection = await UserConnection.count({
        id: ConnectionId
      });

      if (oldConnection < 1) {
        return new CustomError('Invalid UserConnection  Id', {
          status: 403
        });
      }

      let userconnection = {};
      if (req.param('address') != undefined && _.isString(req.param('address'))) {
        userconnection.address = req.param('address');
      }
      if (req.param('router_of') != undefined && _.isNumber(req.param('router_of'))) {
        userconnection.router_of = req.param('router_of') ;//== 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER;
      }
      if (req.param('router_brand') != undefined && _.isString(req.param('router_brand'))) {
        userconnection.router_brand = req.param('router_brand');
      }
      if (req.param('router_model') != undefined && _.isString(req.param('router_model'))) {
        userconnection.router_model = req.param('router_model');
      }
      if (req.param('router_price') != undefined && _.isNumber(req.param('router_price'))) {
        userconnection.router_price = req.param('router_price');
      }
      if (req.param('drop_wire_of') != undefined && _.isNumber(req.param('drop_wire_of'))) {
        userconnection.drop_wire_of = req.param('drop_wire_of'); // == 1 ? UserConnection.COMPANY : UserConnection.CUSTOMER;
      }
      if (req.param('price_per_meter') != undefined && _.isNumber(req.param('price_per_meter'))) {
        userconnection.price_per_meter = req.param('price_per_meter');
      }
      // console.log(req.param('is_wireless'));
      if (req.param('is_wireless') != undefined && _.isBoolean(req.param('is_wireless'))) {
        userconnection.is_wireless = req.param('is_wireless');
      }
      if (req.param('lat') != undefined && _.isString(req.param('lat'))) {
        userconnection.lat = req.param('lat');
      }
      if (req.param('lng') != undefined && _.isString(req.param('lng'))) {
        userconnection.lng = req.param('lng');
      }
      if (req.param('basestation_id') != undefined && _.isNumber(req.param('basestation_id'))) {
        userconnection.basestation = req.param('basestation_id');
      }
      if (req.param('package_id') != undefined && _.isNumber(req.param('package_id'))) {
        userconnection.packages = req.param('package_id');
      }
      if (req.param('salesman_id') != undefined && _.isNumber(req.param('salesman_id'))) {
        userconnection.salesman = req.param('salesman_id');
      }
      if (req.param('dealer_id') != undefined && _.isNumber(req.param('dealer_id'))) {
        userconnection.dealer = req.param('dealer_id');
      }
      if (req.param('customer_id') != undefined && _.isNumber(req.param('customer_id'))) {
        userconnection.customers = req.param('customer_id');
      }
      if (req.param('installed_by') != undefined && _.isNumber(req.param('installed_by'))) {
        userconnection.installed_by = req.param('installed_by');
      }
      if (req.param('registration_date') != undefined && _.isDate(req.param('registration_date'))) {
        userconnection.registration_date = req.param('registration_date');
      }
      if (req.param('username') != undefined && _.isString(req.param('username'))) {
        userconnection.username = req.param('username');
      }
      if (req.param('password') != undefined && _.isString(req.param('password'))) {
        userconnection.password = req.param('password');
      }
      if (req.param('connection_price') != undefined && _.isNumber(req.param('connection_price'))) {
        userconnection.connection_price = req.param('connection_price');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        userconnection.status_id = req.param('status_id');
      }

      const updatedConnection = await UserConnection.update({
        id: ConnectionId
      }, userconnection).fetch();

      if (updatedConnection)
        return updatedConnection;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  connectionTimeline: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    const connectionId = req.param('id');
    const connRenewal = await ConnRenewal.find({
      where: { status_id: { '!=': Status.DELETED }, userconnection: connectionId },
      sort: ['expiration_date ASC'],
    }).populate('userconnection');
    // console.log(connRenewal);

    let dataArray = [];
    for (const cr of connRenewal) {
      let data = {
        id: '',
        // client_name: '',
        // area_dealer: '',
        activation_date: '',
        // contact: '',
        package: '',
        renewal_price: '',
        status: '',
      }
      data.id = cr.id;
      data.activation_date = moment(cr.activation_date).format('MM/DD/YYYY');
      data.renewal_price = cr.renewal_price;
      if (cr.renewal_price)
        data.status = 'Paid'
      else
        data.status = 'Unpaid'
      if (cr.userconnection != null) {

        const package = await Packages.findOne(cr.userconnection.packages);
        if (package) {
          data.package = package.package_name;
        }
        dataArray.push(data);
      }



    }
    // const responseObject = {
    //   dataArray: dataArray,
    //   // totalCount: ConnRenewal_count,
    //   // perPage: params.per_page,
    //   // currentPage: params.page
    // };
    return res.json(dataArray);
    // return res.json(connrenewal);

  },
  pendingConnection: function (req, res) {

    queryObject = {
      where: { status_id: Status.PENDING },
      // // limit: parseInt(params.per_page),
    };

    const getConnection = async () => {

      const Connection_count = await UserConnection.count({ where: { status_id: Status.PENDING } });
      if (!Connection_count) {
        return new CustomError('userconnection not found', {
          status: 403
        });
      }
      let userconnection = await UserConnection.find(queryObject).populate('customers').populate('basestation').populate('packages')
        .populate('salesman').populate('dealer');
      if (!userconnection) {
        return new CustomError('userconnection not found', {
          status: 403
        });
      }

      return userconnection;
    }

    getConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  activeConnection: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId }
    };
    const activeConnection = async () => {

      const checkConnection = await UserConnection.count(queryObject);

      if (checkConnection < 1) {
        return new CustomError('Invalid UserConnection Id', {
          status: 403
        });
      }
      queryObject = {
        where: { id: ConnectionId, status_id: Status.ACTIVE }
      };
      const checkStatus = await UserConnection.count(queryObject);

      if (checkStatus >= 1) {
        return new CustomError('Already Activated', {
          status: 403
        });
      }

      const activeConnection = await UserConnection.update({
        id: ConnectionId
      }, {
          status_id: Status.ACTIVE
        }).fetch();

      if (activeConnection)
        return 'userconnection activated sccessfully';
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    activeConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  liveConnection: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId, status_id: Status.ACTIVE }
    };
    const liveConnection = async () => {

      const userconnection = await UserConnection.findOne(queryObject).populate('packages');

      if (!userconnection) {
        return new CustomError('Invalid UserConnection Id', {
          status: 403
        });
      }
      if (!req.param('activation_date')) {
        return res.badRequest("activation_date required");
      }

      let activation_date = moment(req.param('activation_date'));
      let expiration_date = moment(activation_date).add(1, 'M');
      const countConnRenewal = await ConnRenewal.count({ userconnection: ConnectionId });
      if (countConnRenewal >= 1) {
        return new CustomError('UserConnection already recharged.', {
          status: 403
        });
      }


      const newConnRenewal = await ConnRenewal.create({
        'activation_date': activation_date.toDate(),
        'expiration_date': expiration_date.toDate(),
        'renewal_price': userconnection.connection_price,
        'cost_price': userconnection.packages.cost_price,
        'status_id': Status.PAID,
        'userconnection': userconnection.id,
        'user': req.token.user.id
      }).fetch();
      if (!newConnRenewal) {

        return new CustomError('userconnection renewal create error.', {
          status: 403
        });
      }
      const livconnection = await UserConnection.update({
        id: ConnectionId
      }, {
          status_id: Status.LIVE
        }).fetch();
      if (livconnection) {
        return 'userconnection is live now';
      }
      else {
        return new CustomError('UserConnection recharge error.', {
          status: 403
        });
      }
    }
    liveConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId, status_id: { '!=': Status.DELETED } }
    };
    const deleteConnection = async () => {

      const checkConnection = await UserConnection.count(queryObject);

      if (checkConnection < 1) {
        return new CustomError('Invalid UserConnection Id', {
          status: 403
        });
      }


      const deletedConnection = await UserConnection.update({
        id: ConnectionId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedConnection)
        return deletedConnection;
      return new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};