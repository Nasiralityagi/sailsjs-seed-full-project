/**
 * CustomersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var _ = require('lodash');
var moment = require('moment');
var otplib = require('otplib');
const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
otplib.authenticator.options = {
  step: 180,
  digits: 5
};
const opts = otplib.authenticator.options;

module.exports = {

  create: function (req, res) {
    let password = null;// = util.string.random.number(11);

    if (!req.param('first_name') || !_.isString(req.param('first_name'))) {
      return res.badRequest("first_name required");
    }

    if (!req.param('mobile') || !_.isString(req.param('mobile'))) {

      return res.badRequest("mobile number required");
    }
    if (req.param('password')) {
      password = req.param('password');
    }

    const process = async () => {

      const checkCustomerMobile = await Customers.count({
        mobile: req.param('mobile')
      });

      if (checkCustomerMobile > 0)
        throw new CustomError('This mobile number is  already in use', {
          status: 403
        });
      if (req.param('cnic') != null || req.param('cnic') != undefined) {
        const checkCustomerCnic = await Customers.count({
          cnic: req.param('cnic')
        });

        if (checkCustomerCnic > 0)
          throw new CustomError('This cnic number is  already in exist.', {
            status: 403
          });
      }
      const checkNumberTF = await TokenVerify.count({
        mobile: parseInt(req.param('mobile').substr(1, req.param('mobile').length)),
        status_id: Status.APPROVED
      });

      const newCustomer = await Customers.create({
        'first_name': req.param('first_name'),
        'last_name': req.param('last_name'),
        'email': req.param('email') || '',
        'password': password,
        'mobile': req.param('mobile'),
        'username': req.param('mobile').substr(1, req.param('mobile').length),
        'cnic': req.param('cnic'),
        'status_id': req.param('cnic') == null || req.param('cnic') == undefined ? Status.PENDING : Status.ACTIVE,
        'createdBy': req.param('createdBy') == null || req.param('createdBy') == undefined ? req.token.user.id : req.param('createdBy') , // current logged in user id
        'customer_verified': (req.param('cnic') == null || req.param('cnic') == undefined) &&
          (req.param('verifyManually') == null || req.param('verifyManually') == undefined || checkNumberTF < 1) ? false : true,
        'manually_mobile_verified': req.param('verifyManually'),
      }).fetch();

      if (newCustomer) {
        for (let i = 1; i <= 2; i++) {
          const customerVerify = await CustomerVerify.create({
            customers: newCustomer.id,
            doc_type: i,
            is_verified: i == 1 && (checkNumberTF >= 1 || req.param('verifyManually') == true) ? true : false,
            status_id: Status.ACTIVE,
            createdBy: req.token.user.id, // current logged in user id
          });
        }
        return newCustomer;
      }
      throw new CustomError('Some error occurred. Please contact support team for help. ');
    }

    process()
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
    let customerId = req.param('id');
    let file_name = req.param('file_name');
    let file = req.file('image');
    const oldCustomer = await Customers.count({
      id: customerId
    });

    if (oldCustomer < 1) {
      throw new CustomError('Invalid Customer  Id', {
        status: 403
      });
    }
    const findDoc = await Documents.find({
      where: {
        file_of: 'customer',
        file_of_id: customerId
      },
      sort: 'updatedAt DESC',
      skip: 1,
      select: ['id']
    });

    if (findDoc.length >= 1) {
      const connection = await Connection.findOne({ customers: customerId });
      if (connection) {
        const docType = await RejectDoc.findOne({ connection: connection.id });
        if (docType) {
          if (docType.rejection_type == 1 || docType.rejection_type == 0) {
            const checkConnRenewal = await ConnRenewal.count({ connection: connection.id });
            await Connection.update({ id: connection.id })
              .set({ status_id: checkConnRenewal >= 1 ? Status.ACTIVE : Status.PENDING });
            await RejectDoc.destroy({ connection: connection.id });
          }
        }
      }
    }

    let docArr = [];
    for (let f of findDoc) {
      docArr.push(f.id);
    }
    // console.log(findDoc);
    await Documents.destroy({
      id: { in: docArr }
    });
    const result = await util.fileUpload('customer', customerId, file_name, file, req.token.user.id);
    return res.json(result);

  },
  getToken: async function (req, res) {
    if (!(req.param('mobile')) || isNaN(req.param('mobile')))
      return res.badRequest('mobile a valid request');

    const token = otplib.authenticator.generate(secret);
    const result = await util.sendSMS(req.param('mobile'), token + ' is your verification code.');
    const newTV = await TokenVerify.create({
      'mobile': req.param('mobile'),
      'otp_code': token,
      'status_id': Status.PENDING,
      'createdBy': req.token.user.id, // current logged in user id
    })

    if (result) {
      return res.json(JSON.parse(result).messages);
    }


  },
  verifyToken: async function (req, res) {
    if (!(req.param('mobile')) || isNaN(req.param('mobile')))
      return res.badRequest('mobile a valid request');
    if (!(req.param('token')) || isNaN(req.param('token')))
      return res.badRequest('token a valid request');

    let isValid = otplib.authenticator.check(req.body.token, secret);

    const countTV = await TokenVerify.count({
      mobile: req.param('mobile'),
      otp_code: req.param('token'),
      status_id: Status.PENDING
    });
    if (countTV < 1 && isValid) {
      isValid = false;
    }
    if (isValid) {
      const update = await TokenVerify.update({
        mobile: req.param('mobile'),
        otp_code: req.param('token')
      },
        { 'status_id': Status.APPROVED }).fetch();
    }

    return res.json({ validity: isValid });

  },
  find: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        perPage: 10,
        sort_dir: 'ASC',
        sort: 'first_name',
        query: ''
      });

    var sortable = ['first_name'];

    var filters = params.filters;

    if (!filters || !_.isArray(filters)) {
      filters = [];
    }
    // console.log(params);
    if (params.page) {
      if (!parseInt(params.page) || !_.isNumber(parseInt(params.page))) {
        return res.badRequest({
          err: 'Invalid page field value'
        });
      }
    }
    if (params.perPage) {
      if (!parseInt(params.perPage) || !_.isNumber(parseInt(params.perPage))) {
        return res.badRequest({
          err: 'Invalid perPage field value'
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
        status_id: { '!=': Status.DELETED },
        createdBy: req.token.user.role.id !== 1 ? req.token.user.id : undefined
      },
      // limit: parseInt(params.perPage),
      // skip:parseInt(params.perPage) * parseInt(params.page - 1),
      sort: '',
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'first_name': {
        'like': '%' + params.query + '%'
      }
    }];


    const getCustomers = async () => {
      const customers_count = await Customers.count({
        where: {
          status_id: { '!=': Status.DELETED },
          createdBy: req.token.user.role.id !== 1 ? req.token.user.id : undefined
        }
      });
      if (customers_count < 1) {
        throw new CustomError('customer not found', {
          status: 403
        });
      }

      const customers = await Customers.find(queryObject).populate('customerverify');
      if (!customers) {
        throw new CustomError('customer not found', {
          status: 403
        });
      }
      const responseObject = {
        customers: customers,
        totalCount: customers_count,
        perPage: params.perPage,
        currentPage: params.page
      };
      return responseObject;
    }



    getCustomers()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  customerConnection: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        perPage: 10,
        sort_dir: 'ASC',
        sort: 'first_name',
        query: ''
      });

    var sortable = ['first_name'];

    var filters = params.filters;

    if (!filters || !_.isArray(filters)) {
      filters = [];
    }
    // console.log(params);
    if (params.page) {
      if (!parseInt(params.page) || !_.isNumber(parseInt(params.page))) {
        return res.badRequest({
          err: 'Invalid page field value'
        });
      }
    }
    if (params.perPage) {
      if (!parseInt(params.perPage) || !_.isNumber(parseInt(params.perPage))) {
        return res.badRequest({
          err: 'Invalid perPage field value'
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
    const connection = await Connection.find({
      where: {
        status_id: { '!=': Status.DELETED },

      },
      select: ['customers'],
    })
    let customerArr = [];
    for (let c of connection) {
      customerArr.push(c.customers);
    }
    const findDoc = await Documents.find({
      where: {
        status_id: { '!=': Status.DELETED },
        file_of: 'customer',
        file_of_id: { nin: customerArr },
        // createdBy: req.token.user.role.id !== 1 ? req.token.user.id : undefined
      },
      select: ['file_of_id'],
    });
    if (findDoc.length < 1) {
      return res.status(403).send('customer for new connection not found')
    }
    let docArr = []
    for (let d of findDoc) {
      docArr.push(d.file_of_id);
    }
    let queryObject = {
      where: {
        status_id: { '!=': Status.DELETED },
        customer_verified: true,
        id: { nin: customerArr, in: docArr },
        createdBy: req.token.user.role.id !== 1 ? req.token.user.id : undefined
      },
      // limit: parseInt(params.perPage),
      // skip:parseInt(params.perPage) * parseInt(params.page - 1),

    };
    // if (params.sort && _.indexOf(sortable, params.sort) > -1) {
    //   queryObject.sort = params.sort + ' ' + params.sort_dir;
    // }
    queryObject.where.or = [{
      'first_name': {
        'like': '%' + params.query + '%'
      }
    }];

    const getCustomers = async () => {

      const customers_count = await Customers.count({
        where: {
          status_id: { '!=': Status.DELETED },
          customer_verified: true,
          id: { nin: customerArr, in: docArr },
          createdBy: req.token.user.role.id !== 1 ? req.token.user.id : undefined
        }
      });
      if (customers_count < 1) {
        throw new CustomError('customer for new connection not found', {
          status: 403
        });
      }
      const customers = await Customers.find(queryObject);
      if (!customers) {
        throw new CustomError('customer not found', {
          status: 403
        });
      }
      const responseObject = {
        customers: customers,
        totalCount: customers_count,
        perPage: params.perPage,
        currentPage: params.page
      };
      return responseObject;
    }



    getCustomers()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');

    let customerId = req.param('id');
    let queryObject = {
      where: { id: customerId, status_id: { '!=': Status.DELETED } }
    };

    const getCustomer = async () => {
      let customer = await Customers.findOne(queryObject);
      let files = await Documents.find({
        where: { file_of: 'customer', file_of_id: customerId, status_id: { '!=': Status.DELETED } }
      });

      if (customer) {

        for (let f of files) {
          if (f.file_path.includes('cnicBack')) {
            customer.cnicBack = filePath.fileUrl(f.file_path);
          }
          else if (f.file_path.includes('cnicFront')) {
            customer.cnicFront = filePath.fileUrl(f.file_path);
          }
        }

        return customer;
      }

      else
        throw new CustomError('Customer not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getCustomer()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  customerDoc: function (req, res) {

    const getCustomer = async () => {

      const unverifiedCustomer = await CustomerVerify.findOne({
        where: {
          doc_type: 2,
          is_verified: false
        },
      });
      let queryObject = {
        where: { id: unverifiedCustomer.customers, status_id: { '!=': Status.DELETED } }
      };

      let customer = await Customers.findOne(queryObject);

      let files = await Documents.find({
        where: { file_of: 'customer', file_of_id: customer.id, status_id: { '!=': Status.DELETED } }
      });

      if (customer) {

        for (let f of files) {
          if (f.file_path.includes('cnicBack')) {
            customer.cnicBack = filePath.fileUrl(f.file_path);
          }
          else if (f.file_path.includes('cnicFront')) {
            customer.cnicFront = filePath.fileUrl(f.file_path);
          }
        }
        return customer;
      }

      else
        throw new CustomError('Customer not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getCustomer()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  login: async function (req, res) {
    if (!req.param('mobile') || !_.isString(req.param('mobile'))) {

      return res.badRequest("mobile number required");
    }
    if (req.param('password') || !_.isString(req.param('password'))) {
      return res.badRequest("password is required");

    }

    let queryObject = {
      where: { mobile: req.body.mobile, status_id: { '!=': Status.DELETED } }
    };
    var customersRecord = await Customers.findOne(queryObject);

    if (!customersRecord) {
      throw new CustomError('customers not found', {
        status: 403
      });

    }

    const process = async () => {
      // var fnResult = await util.isMatchedPasswordAsync(req.body.password, customersRecord.password);
      if (req.body.password != customersRecord.password) {
        throw new CustomError('incorrect password', {
          status: 403
        });
      }
      else if (req.body.password == customersRecord.password) {
        return {
          customers: customersRecord,
          token: jwToken.issue({
            customers: customersRecord.id
          }, '1d') //generate the token and send it in the response
        };
      }
    }
    process().then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let customerId = req.param('id');

    const updateCustomer = async () => {

      const oldCustomer = await Customers.count({
        id: customerId
      });

      if (oldCustomer < 1) {
        throw new CustomError('Invalid Customer  Id', {
          status: 403
        });
      }

      let customer = {};

      if (req.param('first_name') != undefined && _.isString(req.param('first_name'))) {
        customer.first_name = req.param('first_name');
      }
      if (req.param('last_name') != undefined && _.isString(req.param('last_name'))) {
        customer.last_name = req.param('last_name');
      }
      if (req.param('cnic') != undefined && _.isString(req.param('cnic'))) {
        const checkCustomerCnic = await Customers.count({
          id: { '!=': customerId }, cnic: req.param('cnic')
        });

        if (checkCustomerCnic > 0)
          throw new CustomError('This cnic number is  already in exist.', {
            status: 403
          });
        customer.cnic = req.param('cnic');
      }
      if (req.param('email') != undefined && _.isString(req.param('email'))) {
        customer.email = req.param('email');
      }
      if (req.param('username') != undefined && _.isString(req.param('username'))) {
        customer.username = req.param('username');
      }
      if (req.param('password') != undefined && _.isNumber(req.param('password'))) {
        customer.password = req.param('password');
      }
      if (req.param('mobile') != undefined && _.isString(req.param('mobile'))) {
        const checkCustomerMobile = await Customers.count({
          id: { '!=': customerId }, mobile: req.param('mobile')
        });

        if (checkCustomerMobile > 0)
          throw new CustomError('This mobile number is  already in use', {
            status: 403
          });
        const checkNumberTF = await TokenVerify.count({
          mobile: parseInt(req.param('mobile').substr(1, req.param('mobile').length)),
          status_id: Status.APPROVED
        });
        if (checkNumberTF > 1 && req.param('cnic') != null || req.param('verifyManually'))
          customer.customer_verified = true,
            customer.mobile = req.param('mobile');
        customer.username = req.param('mobile').substr(1, req.param('mobile').length)
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        customer.status_id = req.param('cnic') == null ? Status.PENDING : req.param('status_id');
      }
      else
        customer.status_id = req.param('cnic') == null ? Status.PENDING : Status.ACTIVE;

        


      const updatedCustomer = await Customers.update({
        id: customerId
      }, customer).fetch();

      if (updatedCustomer)
        return updatedCustomer;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateCustomer()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  customerTimeline: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    const customerId = req.param('id');
    const connection = await Connection.find(
      {
        where: { status_id: { '!=': Status.DELETED }, customers: customerId },
        select: ['id']
      });
    // console.log(connection);
    const connRenewal = await ConnRenewal.find({
      where: { status_id: { '!=': Status.DELETED }, id: connection.id },
    }).populate('connection');

    let dataArray = [];
    for (const cr of connRenewal) {
      let data = {
        client_name: '',
        area_dealer: '',
        activation_date: '',
        contact: '',
        package: '',
      }
      data.activation_date = moment(cr.activation_date).format('MM/DD/YYYY');
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
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let customerId = req.param('id');
    let queryObject = {
      where: { id: customerId, status_id: { '!=': Status.DELETED } }
    };
    const deleteCustomer = async () => {

      const checkCustomer = await Customers.count(queryObject);

      if (checkCustomer < 1) {
        throw new CustomError('Invalid customer Id', {
          status: 403
        });
      }


      const deletedCustomer = await Customers.update({
        id: customerId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedCustomer)
        return deletedCustomer;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteCustomer()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
};