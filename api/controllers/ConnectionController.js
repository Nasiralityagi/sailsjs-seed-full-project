/**
 * ConnectionController
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

      const countConnection = await Connection.count({ customers: req.param('customers'), status_id: { '!=': Status.DELETED } })
      if (countConnection >= 1) {
        throw new CustomError('Connection already created for this customer', {
          status: 403
        });
      }
      const customer = await Customers.findOne({ id: req.param('customers') });
      if (!customer) {
        throw new CustomError('customer not found', {
          status: 403
        });
      }
      const newConnection = await Connection.create({
        'address': req.param('address'),
        'router_of': req.param('router_of'),//== 1 ? Connection.COMPANY : Connection.CUSTOMER,
        'router_brand': req.param('router_brand'),
        'router_model': req.param('router_model'),
        'router_price': req.param('router_price'),
        'drop_wire_of': req.param('drop_wire_of'),// == 1 ? Connection.COMPANY : Connection.CUSTOMER,
        'drop_wire_length': req.param('drop_wire_length'),
        'price_per_meter': req.param('price_per_meter'),
        'is_wireless': req.param('is_wireless'),
        'lat': req.param('lat'),
        'long': req.param('long'),
        'customers': req.param('customers'),
        'packages': req.param('packages'),
        'basestation': req.param('basestation_id'),
        'salesman': req.param('salesman_id'),
        'dealer': customer.createdBy,
        'connection_price': req.param('connection_price'),
        'registration_date': moment().format("YYYY-MM-DD HH:mm:ss"),
        'installed_by': req.param('installed_by'),
        'status_id': Status.PENDING,
        'createdBy': req.token.user.id, // current logged in user id
      }).fetch();

      if (newConnection) {
        const invoice = await Invoices.findOne({ id: req.param('invoices'), customers: newConnection.customers });
        if (invoice) {

          const activation_date = moment();
          const billing_date = moment(activation_date).add(1, 'M');
          const expiration_date = moment(activation_date).add(1, 'M').subtract(1, 'd');
          let cost_price;
          let connection = await Connection.findOne({ id: newConnection.id }).populate('packages');
          if (connection.packages)
            cost_price = connection.packages.cost_price;
          const renewConn = await ConnRenewal.create({
            'activation_date': activation_date.toDate(),
            'expiration_date': expiration_date.toDate(),
            'billing_date' : billing_date.toDate(),
            'renewal_price': invoice.total_price,
            'cost_price': cost_price,
            'is_advance': false,
            'status_id': Status.PENDING,
            'connection': newConnection.id,
            'packages': newConnection.packages,
            'createdBy': req.token.user.id
          }).fetch();
          // if(invoice.paid){
          // await sails.helpers.makeConnectionPayment(connection.id, renewConn.renewal_price,
          //   renewConn.cost_price, connection.dealer == 1 ? 1 : 3, renewConn.createdBy)
          //   .intercept('error', () => {
          //      ConnRenewal.update({
          //       id: renewConn.id
          //     }, { status_id: Status.PAID });
          //     throw new CustomError('error while connection recharge.', {
          //       status: 403
          //     });
          //   });
          // }
        }

        return newConnection;
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
        where: { status_id: { nin: [Status.DELETED] }, dealer: req.token.user.id },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    else {
      queryObject = {
        where: { status_id: { nin: [Status.DELETED] } },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }

    queryObject.where.or = [{
      doc_verified: params.doc == '1' ? true : undefined,
    }];
    // if(params.doc == '1'){
    //   queryObject.select = ['customers'];
    // }
    // console.log(params, queryObject.where.or , params.query);
    if (params.doc == '1') {
      queryObject.select = ['id', 'connection_price', 'address'];

    }
    const getConnection = async () => {

      const Connection_count = await Connection.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (Connection_count < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let connection = await Connection.find(queryObject).populate('customers').populate('packages')
        .populate('rejectdoc').populate('dealer');
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      const responseObject = {
        connection: connection,
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
  connectionToChange: function (req, res) {
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
        where: { doc_verified: true, requested_status_id: { nin: [Status.INACTIVE] }, status_id: { in: [Status.ACTIVE], }, dealer: req.token.user.id },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    else {
      queryObject = {
        where: { doc_verified: true, status_id: { in: [Status.ACTIVE] }, requested_status_id: { nin: [Status.INACTIVE] } },
        // // limit: parseInt(params.per_page),
        sort: '',
      };
    }
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.select = ['id', 'connection_price', 'address', 'status_id'];

    const getConnection = async () => {

      const Connection_count = await Connection.count({
        where: {
          requested_status_id: { nin: [Status.INACTIVE] },
          status_id: { in: [Status.ACTIVE, params.block == '1' ? Status.INACTIVE : undefined], }
        }
      });
      if (Connection_count < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }

      let connList = [];
      if (params.block == '1') {
        queryObject.where.status_id.in.push(Status.INACTIVE);
      }
      if (params.for == 'password-change') {
        connList = await ChangePassword.find({ status_id: Status.PENDING });
      }
      else if (params.for == 'change-mac') {
        connList = await ChangeMac.find({ status_id: Status.PENDING });
      }
      else if (params.for == 'change-package') {
        connList = await ChangePackage.find({ status_id: Status.PENDING });
      }
      const renewList = await ConnRenewal.find({ status_id: Status.PAID });
      connList.push(...renewList);
      let connArr = [];
      for (const c of connList) {
        // const pos = myArray.map(function(e) { return e.hello; }).indexOf('stevie');
        connArr.push(c.connection);
      }
      queryObject.where.id = { nin: connArr };
      let connection = await Connection.find(queryObject).populate('customers').populate('packages')
        .populate('dealer');
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      const responseObject = {
        connection: connection,
        totalCount: Connection_count,
      };
      return responseObject;
    }

    getConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  changePackage: async function (req, res) {
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid conenction id');
    let ConnectionId = req.param('id');
    if (!(req.param('old_package')) || isNaN(req.param('old_package')))
      return res.badRequest('Not a valid old_package');

    if (!(req.param('new_package')) || isNaN(req.param('new_package')))
      return res.badRequest('Not a valid new_package');
    if (!(req.param('connection_price')) || isNaN(req.param('connection_price')))
      return res.badRequest('Not a valid connection_price');
    let queryObject = {
      where: { connection: ConnectionId, status_id: { '!=': Status.DELETED } },
      sort: ['expiration_date DESC'],
      limit: 1,
    };
    let connRenewal = await ConnRenewal.find(queryObject);
    if (connRenewal.length >= 1) {
      if (moment.utc(connRenewal[0].updatedAt).format('MM/DD/YYYY') == moment().format('MM/DD/YYYY')) {
        return res.badRequest({ err: "cannot change package on the same day connection renewed" });
      }
    }
    const process = async () => {
      const changePackage = await ChangePackage.create({
        connection: ConnectionId,
        status_id: Status.PENDING,
        old_package: req.param('old_package'),
        new_package: req.param('new_package'),
        connection_price: req.param('connection_price'),
        createdBy: req.token.user.id,
      }).fetch();

      if (!changePackage) {
        throw new CustomError('error while changing package', {
          status: 403
        });
      }
      else {
        await Connection.update({ id: ConnectionId })
          .set({
            status_id: Status.PACKAGE_UPDATED,
            //  connection_price:changePackage.connection_price,
            //  packages:changePackage.new_package 
          });
        return "Package Changed";
      }


    }
    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  changePassword: function (req, res) {
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid conenction id');
    let ConnectionId = req.param('id');
    if (!(req.param('customer_id')) || isNaN(req.param('customer_id')))
      return res.badRequest('Not a valid customers id');

    if (!(req.param('new_password')) || isNaN(req.param('new_password')))
      return res.badRequest('Not a valid new_password');

    const process = async () => {
      const changePassword = await ChangePassword.create({
        connection: ConnectionId,
        status_id: Status.PENDING,
        new_password: req.param('new_password'),
        old_password: req.param('old_password'),
        createdBy: req.token.user.id,
      }).fetch();
      if (req.param('inactive') == '1') {
        await Connection.update({ id: ConnectionId }).set({ requested_status_id: Status.INACTIVE })
      }
      else if (req.param('inactive') == '0') {
        await Connection.update({ id: ConnectionId }).set({ requested_status_id: Status.ACTIVE })
      }
      if (!changePassword) {
        throw new CustomError('error while changing password', {
          status: 403
        });
      }
      else {

        return "Password Changed";
      }


    }
    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  clearMac: function (req, res) {
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let ConnectionId = req.param('id');
    const process = async () => {
      const changeMac = await ChangeMac.create({
        connection: ConnectionId,
        status_id: Status.PENDING,
      }).fetch();
      if (!changeMac) {
        throw new CustomError('error while changing mac', {
          status: 403
        });
      }
      return 'cleared Mac'
    }
    process()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  connectionList: function (req, res) {
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
      // 'router_price': {
      //   'like': '%' + params.query + '%'
      // },
      doc_verified: params.doc == '1' ? true : undefined,
    }];
    // if(params.doc == '1'){
    //   queryObject.select = ['customers'];
    // }
    // console.log(params, queryObject.where.or , params.query);
    queryObject.select = ['customers', 'registration_date', 'packages', 'status_id'];
    const getConnection = async () => {

      const Connection_count = await Connection.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (Connection_count < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let connection = await Connection.find(queryObject).populate('customers').populate('packages')
        .populate('rejectdoc').populate('dealer');
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      let cList = [];
      for (let c of connection) {
        let connectionList = {};
        connectionList.id = c.id;
        connectionList.username = c.customers.username;
        connectionList.cnic = c.customers.cnic;
        connectionList.package = c.packages.package_name;
        connectionList.customer = c.customers.first_name;
        connectionList.registration_date = moment(c.registration_date).format('DD/MM/YYYY');
        connectionList.dealer = c.dealer.first_name
        connectionList.status_id = c.status_id
        cList.push(connectionList);
      }
      const responseObject = {
        connection: cList,
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
      let connection = await Connection.findOne(queryObject).populate('customers').populate('packages')
        .populate('rejectdoc').populate('dealer');

      if (connection) {
        let dFiles = await Documents.find({
          where: { file_of: 'connection', file_of_id: connection.id, status_id: { '!=': Status.DELETED } }
        });
        if (dFiles.length > 0)
          connection.regForm = filePath.fileUrl(dFiles[0].file_path);

        const invoice = await Invoices.findOne({ customers: connection.customers.id, packages: { '!=': null } });
        connection.invoices = [invoice];
        return connection;
      }
      else
        throw new CustomError('Connection not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  // upload file for connection
  fileUpload: async function (req, res) {
    if (!req.param('id')) {
      return res.badRequest("Id is required");
    }
    if (!req.param('file_name') || !_.isString(req.param('file_name'))) {
      return res.badRequest("file_name required");
    }
    let ConnectionId = req.param('id');
    let file_name = req.param('file_name');
    let file = req.file('image');
    const oldConnection = await Connection.count({
      id: ConnectionId
    });
    const uploadFile = async () => {
      const deleteDoc = await Documents.destroy({
        file_of: 'connection',
        file_of_id: ConnectionId,
      }).fetch();

      if (deleteDoc) {
        const docType = await RejectDoc.findOne({ connection: ConnectionId });
        if (docType) {
          if (docType.rejection_type == 2) {
            //change connection status

            await Connection.update({
              id: ConnectionId
            }, {
                status_id: Status.PENDING,
              });

          }
        }
      }

      if (oldConnection < 1) {
        throw new CustomError('Invalid Connection  Id', {
          status: 403
        });
      }
      const result = await util.fileUpload('connection', ConnectionId, file_name, file, req.token.user.id);
      return result;
    }
    uploadFile().then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let ConnectionId = req.param('id');

    const updateConnection = async () => {

      const oldConnection = await Connection.count({
        id: ConnectionId
      });

      if (oldConnection < 1) {
        throw new CustomError('Invalid Connection  Id', {
          status: 403
        });
      }

      let connection = {};
      if (req.param('address') != undefined && _.isString(req.param('address'))) {
        connection.address = req.param('address');
      }
      if (req.param('router_of') != undefined && _.isNumber(req.param('router_of'))) {
        connection.router_of = req.param('router_of');//== 1 ? Connection.COMPANY : Connection.CUSTOMER;
      }
      if (req.param('router_brand') != undefined && _.isString(req.param('router_brand'))) {
        connection.router_brand = req.param('router_brand');
      }
      if (req.param('router_model') != undefined && _.isString(req.param('router_model'))) {
        connection.router_model = req.param('router_model');
      }
      if (req.param('router_price') != undefined && _.isNumber(req.param('router_price'))) {
        connection.router_price = req.param('router_price');
      }
      if (req.param('drop_wire_of') != undefined && _.isNumber(req.param('drop_wire_of'))) {
        connection.drop_wire_of = req.param('drop_wire_of'); // == 1 ? Connection.COMPANY : Connection.CUSTOMER;
      }
      if (req.param('price_per_meter') != undefined && _.isNumber(req.param('price_per_meter'))) {
        connection.price_per_meter = req.param('price_per_meter');
      }
      // console.log(req.param('is_wireless'));
      if (req.param('is_wireless') != undefined && _.isBoolean(req.param('is_wireless'))) {
        connection.is_wireless = req.param('is_wireless');
      }
      if (req.param('lat') != undefined && _.isString(req.param('lat'))) {
        connection.lat = req.param('lat');
      }
      if (req.param('long') != undefined && _.isString(req.param('long'))) {
        connection.long = req.param('long');
      }
      if (req.param('basestation_id') != undefined && _.isNumber(req.param('basestation_id'))) {
        connection.basestation = req.param('basestation_id');
      }

      if (req.param('packages') != undefined && _.isNumber(req.param('packages'))) {
        connection.packages = req.param('package_id');


      }
      if (req.param('salesman_id') != undefined && _.isNumber(req.param('salesman_id'))) {
        connection.salesman = req.param('salesman_id');
      }
      if (req.param('dealer_id') != undefined && _.isNumber(req.param('dealer_id'))) {
        connection.dealer = req.param('dealer_id');
      }
      if (req.param('customer_id') != undefined && _.isNumber(req.param('customer_id'))) {
        connection.customers = req.param('customer_id');
      }
      if (req.param('installed_by') != undefined && _.isNumber(req.param('installed_by'))) {
        connection.installed_by = req.param('installed_by');
      }
      if (req.param('registration_date') != undefined) {
        connection.registration_date = moment(req.param('registration_date')).toDate();
      }
      if (req.param('connection_price') != undefined && _.isNumber(req.param('connection_price'))) {
        connection.connection_price = req.param('connection_price');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        connection.status_id = req.param('status_id');
      }
      if (req.param('in_review') != undefined && _.isBoolean(req.param('in_review'))) {
        connection.in_review = req.param('in_review');
      }
      if (req.param('doc_verified') != undefined && _.isBoolean(req.param('doc_verified'))) {
        connection.doc_verified = req.param('doc_verified');
        if (connection.doc_verified) {
          await CustomerVerify.update({ doc_type: CustomerVerify.CNIC, is_verified: false, customers: req.param('customers') })
            .set({ is_verified: true });
          // const conn = await Connection.findOne({ id: ConnectionId });
          // const invoiceCount = await Invoices.count({ customers: conn.customers, paid: true, packages: { '!=': null } });
          await Connection.update({
            id: ConnectionId
          }, {
              status_id: Status.PENDING,
            });
          await RejectDoc.destroy({ connection: ConnectionId });
          await Customers.update({ id: req.param('customers') }).set({ customer_verified: true });
        }
      }

      const updatedConnection = await Connection.update({
        id: ConnectionId
      }, connection).fetch();

      if (updatedConnection)
        return updatedConnection;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
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
    const ConnectionId = req.param('id');
    const connRenewal = await ConnRenewal.find({
      where: { status_id: { '!=': Status.DELETED }, connection: ConnectionId },
      sort: ['expiration_date ASC'],
    }).populate('connection');
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
      if (cr.connection != null) {

        const package = await Packages.findOne(cr.connection.packages);
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
  pendingConnection: async function (req, res) {

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
      where: { status_id: [Status.PENDING], },
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

    const getConnection = async () => {


      const connRenewal = await ConnRenewal.find(queryObject);
      if (connRenewal.length < 1) {
        return connRenewal;
      }

      // new code
      const connection = await Connection.find({
        id: connRenewal[0].connection,
        status_id: { in: [Status.PENDING, Status.PAID], nin: [Status.DELETED, Status.IN_REVIEW] },
        doc_verified: true,
        in_review: false
      }).limit(1).populate('customers').populate('packages')
        .populate('salesman').populate('dealer');
      if (connection.length < 1) {
        throw new CustomError('connection not found', {
          status: 403
        });
      }
      const countConn = await Connection.count({
        status_id: { in: [Status.PENDING, Status.PAID], nin: [Status.DELETED, Status.IN_REVIEW] },
        doc_verified: true,
        in_review: false
      });

      await Connection.update({
        id: connection[0].id
      }, {
          in_review: true
        });
      var CronJob = require('cron').CronJob;
      let connectionReview = new CronJob({
        cronTime: '* * * * *', //'* * * * *',
        onTick: async function () {
          // console.log('crop job started in connection');
          const conn = await Connection.findOne({ id: connection[0].id });
          if (conn.in_review) {
            await Connection.update({
              id: connection[0].id
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
      let response = {
        connection: connection[0],
        count: countConn,
      }
      response.connection.connRenewalId = connRenewal[0].id;
      return response;

    }

    getConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  packageChangeList: async function (req, res) {
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
      where: { status_id: [Status.PAID, Status.PENDING, Status.UNPAID], },
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
        status_id: { in: [Status.PACKAGE_UPDATED], nin: [Status.DELETED, Status.IN_REVIEW] },
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
      connection.connRenewalId = connRenewal[0].id;
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
  activeConnection: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');

    const activeConnection = async () => {

      // const checkConnection = await Connection.count(queryObject);

      // if (checkConnection < 1) {
      //   throw new CustomError('Invalid Connection Id', {
      //     status: 403
      //   });
      // }
      const queryObjectStatus = {
        where: { id: ConnectionId, status_id: Status.REGISTERED }
      };
      const checkStatus = await Connection.count(queryObjectStatus);

      if (checkStatus >= 1) {
        throw new CustomError('Already Activated', {
          status: 403
        });
        // return res.notFound('Already Activated')
      }

      const activeConnection = await Connection.update({
        id: ConnectionId
      }, {
          status_id: Status.REGISTERED
        }).fetch();

      const queryObject = {
        where: { id: ConnectionId, status_id: { '!=': Status.DELETED } }
      };
      const connection = await Connection.findOne(queryObject).populate('customers');


      if (activeConnection && connection) {

        // await Invoices.update({
        //   customers: connection.customers.id, packages: { '!=': null }
        // }).set({ status_id: Status.ACTIVE });
        // const newAcount = await Account.create({
        //   'name': connection.customers.username,
        //   'root_type': Account.INCOME,
        //   'account_type': Account.CASH,
        //   'account_number': 0,
        //   'is_group': false,
        //   'status_id': Status.ACTIVE,
        // }).fetch();

        // if (newAcount) {
        //   await Account.addToCollection(newAcount.id, 'parent', 99);
        // }
        // else {
        //   const revertUpdate = await Connection.update({
        //     id: ConnectionId
        //   }, {
        //       status_id: Status.PENDING
        //     }).fetch();
        //   if (revertUpdate) {
        //     throw new CustomError('connection activation error', {
        //       status: 403
        //     });
        //   }
        // }
        let msg = 'Your username and password is : ' + connection.customers.username + ' , ' + connection.customers.password
        await hybridNotification.sendSMS('92' + connection.customers.username, msg);
        return 'connection activated sccessfully';
      }
      throw new CustomError('connection activation error', {
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

      const connection = await Connection.findOne(queryObject).populate('packages');

      if (!connection) {
        throw new CustomError('Invalid Connection Id', {
          status: 403
        });
      }
      if (!req.param('activation_date')) {
        return res.badRequest("activation_date required");
      }

      let activation_date = moment(req.param('activation_date'));
      let expiration_date = moment(activation_date).add(1, 'M');
      const countConnRenewal = await ConnRenewal.count({ connection: ConnectionId });
      if (countConnRenewal >= 1) {
        throw new CustomError('Connection already recharged.', {
          status: 403
        });
      }


      const newConnRenewal = await ConnRenewal.create({
        'activation_date': activation_date.toDate(),
        'expiration_date': expiration_date.toDate(),
        'renewal_price': connection.connection_price,
        'cost_price': connection.packages.cost_price,
        'status_id': Status.PAID,
        'connection': connection.id,
        'is_advance': true,
        'user': req.token.user.id,
        'createdBy': req.token.user.id, // current logged in user id
      }).fetch();
      if (!newConnRenewal) {

        throw new CustomError('connection renewal create error.', {
          status: 403
        });
      }
      const livconnection = await Connection.update({
        id: ConnectionId
      }, {
          status_id: Status.LIVE
        }).fetch();
      if (livconnection) {
        return 'connection is live now';
      }
      else {
        throw new CustomError('Connection recharge error.', {
          status: 403
        });
      }
    }
    liveConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  increaseTimer: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId, status_id: { '!=': Status.DELETED } }
    };
    const updateConnection = async () => {

      const checkConnection = await Connection.count(queryObject);

      if (checkConnection < 1) {
        throw new CustomError('Invalid Connection Id', {
          status: 403
        });
      }


      await Connection.update({
        id: ConnectionId
      }, {
          in_review: true
        })
      var CronJob = require('cron').CronJob;
      let connectionReview = new CronJob({
        cronTime: '* * * * *', //'* * * * *',
        onTick: async function () {
          // console.log('crop job started in timmer');
          const conn = await Connection.findOne({ id: ConnectionId });
          if (conn.in_review) {

            await Connection.update({
              id: ConnectionId
            }, {
                in_review: false
              });
          }
          connectionReview.stop();
          // console.log('cron job stopped in trigger timer');
        },
        start: false,
        timeZone: 'America/Los_Angeles'
      });
      connectionReview.start();
      return 'ok';


    }
    updateConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  rejectDoc: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    if (!req.param('rejectType') || isNaN(req.param('rejectType'))) {
      return res.badRequest("rejectType is required");
    }
    let ConnectionId = req.param('id');
    let queryObject = {
      where: { id: ConnectionId, status_id: { '!=': Status.DELETED } }
    };
    const rejectConnection = async () => {
      const checkConnection = await Connection.count(queryObject);

      if (checkConnection < 1) {
        throw new CustomError('Invalid Connection Id', {
          status: 403
        });
      }
      await RejectDoc.destroy({
        connection: ConnectionId
      });
      const rejectDoc = await RejectDoc.create({
        connection: ConnectionId,
        rejection_type: req.param('rejectType'),
        createdBy: req.token.user.id,
      }).fetch();
      const updateConnection = await Connection.update({
        id: ConnectionId
      }, {
          status_id: Status.REJECTED
        }).fetch();

      if (rejectDoc && updateConnection) {
        return 'Rejected Successfully';
      }
      else {
        throw new CustomError('Error while rejecting.', {
          status: 403
        });
      }
    }
    rejectConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  docFind: async function (req, res) {
    let queryObject = {
      where: {
        doc_verified: false,
        in_review: false,
        status_id: { in: [Status.PENDING], nin: [Status.DELETED, Status.IN_REVIEW] }
      }
    }
    const findConnection = async () => {
      const count = await Connection.count(queryObject);
      let connection = await Connection.find(queryObject).limit(1).populate('customers');

      if (connection.length >= 1) {
        await Connection.update({
          id: connection[0].id
        }, {
            in_review: true,
          });
        var CronJob = require('cron').CronJob;
        let connectionReview = new CronJob({
          cronTime: '* * * * *', //'* * * * *',
          onTick: async function () {
            // console.log('crop job started in connection');
            const conn = await Connection.findOne({ id: connection[0].id });
            if (conn.in_review) {
              // const checkConnRenewal = await ConnRenewal.count({ connection: connection[0].id ,  status_id :{'!=':Status.UNPAID}});
              await Connection.update({ id: connection[0].id })
                .set({ in_review: false });
            }
            connectionReview.stop();
            // console.log('cron job stopped in find doc');
          },
          start: false,
          timeZone: 'America/Los_Angeles'
        });
        connectionReview.start();
        let cFiles = await Documents.find({
          where: { file_of: 'customer', file_of_id: connection[0].customers.id, status_id: { '!=': Status.DELETED } }
        });
        for (let f of cFiles) {
          if (f.file_path.includes('cnicBack')) {
            connection[0].cnicBack = filePath.fileUrl(f.file_path);
          }
          else if (f.file_path.includes('cnicFront')) {
            connection[0].cnicFront = filePath.fileUrl(f.file_path);
          }
        }
        let dFiles = await Documents.find({
          where: { file_of: 'connection', file_of_id: connection[0].id, status_id: { '!=': Status.DELETED } }
        });
        if (dFiles.length >= 1) {
          connection[0].regForm = filePath.fileUrl(dFiles[0].file_path);
        }
        if (!connection[0].regForm || !connection[0].cnicBack || !connection[0].cnicFront) {
          throw new CustomError('document not found for connection id ' + connection[0].id, {
            status: 403
          });
        }
      }
      // console.log(connection);
      if (connection.length >= 1) {
        response = {
          connection: connection[0],
          count: count,
        }
        return response;
      }


      throw new CustomError('No connection found for document verification', {
        status: 403
      });


    }
    findConnection()
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

      const checkConnection = await Connection.count(queryObject);

      if (checkConnection < 1) {
        throw new CustomError('Invalid Connection Id', {
          status: 403
        });
      }


      const deletedConnection = await Connection.update({
        id: ConnectionId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedConnection)
        return deletedConnection;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteConnection()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};