/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {

  create: function (req, res) {

    let password = util.string.random.number(11);

    if (!req.param('first_name') || !_.isString(req.param('first_name'))) {
      return res.badRequest("first_name required");
    }
    if (!req.param('last_name') || !_.isString(req.param('last_name'))) {

      return res.badRequest("last_name required");
    }
    // console.log(!_.isString(req.param('username')) + ' value : '+ req.param('username'));
    if (!_.isString(req.param('username'))) {
      return res.badRequest("username required");
    }

    //make sure email is provided
    if (!req.param('mobile') || !_.isString(req.param('mobile'))) {

      return res.badRequest("mobile number required");
    }
    if (!req.param('role_id') || !_.isNumber(req.param('role_id'))) {

      return res.badRequest("role_id is required");
    }

    if (req.param('password')) {
      if (!_.isString(req.param('password')))
        return res.badRequest("password is required");
      password = req.param('password');
    }

    const process = async () => {

      const checkUser = await User.count({
        mobile: req.param('mobile')
      });
      const checkUserName = await User.count({
        mobile: req.param('username')
      });

      if (checkUserName > 0)
        throw new CustomError('This username is already in use', {
          status: 403
        });
      if (checkUser > 0)
        throw new CustomError('This mobile number is already in use', {
          status: 403
        });

      let encryptedPassword = await util.getEncryptedPasswordAsync(password);

      if (!encryptedPassword)
        throw new CustomError('Some error occurred. Please contact support team for help', {
          status: 403
        });
      const newUser = await User.create({
        'first_name': req.param('first_name'),
        'last_name': req.param('last_name'),
        'mobile': req.param('mobile'),
        'email': req.param('email'),
        'job_title': req.param('job_title'),
        'password': encryptedPassword,
        'status_id': Status.ACTIVE,
        'username': req.param('username'),
        'role': req.param('role_id'),
        'createdBy': req.token.user.id, // current logged in user id 
      }).fetch();

      if (newUser) {
        const newAcount = await Account.create({
          'name': newUser.username,
          'root_type': Account.INCOME,
          'account_type': Account.CASH,
          'account_number': 0,
          'is_group': false,
          'status_id': Status.ACTIVE,
          'createdBy': req.token.user.id, // current logged in user id 
        }).fetch();

        if (newAcount) {
          await Account.addToCollection(newAcount.id, 'parent', 129);
        }

        return newUser;
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
        sort: 'first_name',
        query: ''
      });

    var sortable = ['first_name'];

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
      where: { status_id: { '!=': Status.DELETED }, role: req.param('role_id') },
      // // limit: parseInt(params.per_page),
      sort: '',
    };

    queryObject.where.or = [{
      'first_name': {
        'like': '%' + params.query + '%'
      }
    }];

    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }

    const getUsers = async () => {

      const user_count = await User.count({ where: { status_id: { '!=': Status.DELETED }, role: req.param('role_id') } });
      if (user_count < 1) {
        throw new CustomError('user not found', {
          status: 403
        });
      }
      let users = await User.find(queryObject).populate('role');
      if (users) {
        const responseObject = {
          users: users,
          totalCount: user_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
      throw new CustomError('user not found', {
        status: 403
      });
    }

    getUsers()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let userId = req.param('id');

    let queryObject = {
      where: { id: userId, status_id: { '!=': Status.DELETED } }
    };
    const getUser = async () => {
      let user = await User.findOne(queryObject).populate('role');

      if (user)
        return user;
      else
        throw new CustomError('User not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getUser()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  login: async function (req, res) {

    if (!req.param('mobile') || !_.isString(req.param('mobile'))) {

      return res.badRequest("mobile number required");
    }
    if (!req.param('password') || !_.isString(req.param('password'))) {
      return res.badRequest("password is required");

    }

    let queryObject = {
      where: { mobile: req.body.mobile, status_id: { '!=': Status.DELETED } }
    };
    var userRecord = await User.findOne(queryObject).populate('role');

    if (!userRecord) {
      return res.json({ error: 'User not found' })
    }


    const process = async () => {

      var fnResult = await util.isMatchedPasswordAsync(req.param('password'), userRecord.password);
      if (!fnResult) {
        return { error: 'error' };
      }
      else if (fnResult != true) {
        return fnResult;
      }
      else if (fnResult == true) {
        return {
          user: userRecord,
          token: jwToken.issue({
            user: userRecord
          }, '1d') //generate the token and send it in the response
        };
      }
    }
    process().then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  logout: function (req, res) {
    req.token = '';
    res.status(200).json({ msg: 'logout' })
  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let password = util.string.random.number(11);
    let userId = req.param('id');
    const updateUser = async () => {

      const oldUser = await User.count({ id: userId });

      if (oldUser < 1) {
        throw new CustomError('Invalid User  Id', {
          status: 403
        });
      }

      let user = {};

      if (req.param('username') != undefined && _.isString(req.param('username'))) {
        user.username = req.param('username');
      }
      if (req.param('title') != undefined && _.isString(req.param('title'))) {
        user.title = req.param('title');
      }
      if (req.param('first_name') != undefined && _.isString(req.param('first_name'))) {
        user.first_name = req.param('first_name');
      }
      if (req.param('last_name') != undefined && _.isString(req.param('last_name'))) {
        user.last_name = req.param('last_name');
      }
      if (req.param('email') != undefined && _.isString(req.param('email'))) {
        user.email = req.param('email');
      }
      if (req.param('email_signature') != undefined && _.isString(req.param('email_signature'))) {
        user.email_signature = req.param('email_signature');
      }
      if (req.param('mobile') != undefined && _.isString(req.param('mobile'))) {
        user.mobile = req.param('mobile');
      }
      if (req.param('image') != undefined && _.isString(req.param('image'))) {
        user.image = req.param('image');
      }
      if (req.param('job_title') != undefined && _.isString(req.param('job_title'))) {
        user.job_title = req.param('job_title');
      }
      if (req.param('active') != undefined && _.isNumber(req.param('active'))) {
        user.active = req.param('active');
      }
      if (req.param('is_admin') != undefined && _.isBoolean(req.param('is_admin'))) {
        user.is_admin = req.param('is_admin');
      }
      if (req.param('password') != undefined && _.isString(req.param('password'))) {
        password = req.param('password');
        let encryptedPassword = await util.getEncryptedPasswordAsync(password);
        user.password = encryptedPassword;
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        user.status_id = req.param('status_id');
      }
      if (req.param('role_id') != undefined && _.isNumber(req.param('role_id'))) {
        user.role = req.param('role_id');
      }

      const updatedUser = await User.update({
        id: userId
      }, user).fetch();;

      if (updatedUser)
        return updatedUser;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateUser()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let userId = req.param('id');
    let queryObject = {
      where: { id: userId, status_id: { '!=': Status.DELETED } }
    };
    const deleteUser = async () => {

      const checkUser = await User.count(queryObject);

      if (checkUser < 1) {
        throw new CustomError('Invalid User Id', {
          status: 403
        });
      }


      const deletedUser = await User.update({
        id: userId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedUser)
        return deletedUser;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteUser()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  }
}