/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash'); 
module.exports = {

    create:function(req,res){       

    let password = util.string.random.number(11);

    if (!req.param('first_name') || !_.isString(req.param('first_name'))) {
      return res.badRequest("first_name required");
    }

    //make sure lastName is provided
    if (!req.param('last_name') || !_.isString(req.param('last_name'))) {

      return res.badRequest("last_name required");
    }
    // console.log(!_.isNumber(req.param('role_type')) + ' value : '+ req.param('role_type'));
    if (!_.isNumber(req.param('role_type'))) {

      return res.badRequest("role_type required");
    }

    //make sure email is provided
    if (!req.param('mobile') || !_.isString(req.param('mobile'))) {

      return res.badRequest("mobile number required");
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

      if (checkUser > 0)
        throw new CustomError('This mobile number is  already in use', {
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
        'password': encryptedPassword,
        'status_id': Status.ACTIVE,
        'role_type': req.param('role_type')        
      }).fetch();
     
      if (newUser)
        return newUser;

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
        where: {}
      };
  
      queryObject.where.or = [{
        'like': {
          'name': '%' + params.query + '%'
        }
      }];
  
  
      if (params.sort && _.indexOf(sortable, params.sort) > -1) {
        queryObject.sort = params.sort + ' ' + params.sort_dir;
      }
  
      const getUsers = async() => {
  
        const user_count = await User.count(queryObject);
        let users = await User.find(queryObject).paginate({
          page: parseInt(params.page, 10),
          limit: parseInt(params.per_page, 10) // Overwrite the project-wide settings
  
        });
        const responseObject = {
          users: users,
          totalCount: user_count,
          perPage: params.per_page,
          currentPage: params.page
        };
        return responseObject;
      }
  
      getUsers()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

      if (!(req.param('id')) || isNaN(req.param('id')))
        return res.badRequest('Not a valid request');
      let userId = req.param('id')
  
      const getUser = async() => {
        let user = await User.findOne({
          id: userId
        });
  
        if (user)
          return user;
        else
          return new CustomError('User not found', {
            status: 403
          });
  
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
      }
  
      getUser()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    login: async function (req, res) {

      var userRecord = await User.findOne({
        mobile: req.body.mobile,
      });
      
      // If there was no matching user, respond thru the "badCombo" exit.
      if(!userRecord) {
          return res.json({error : 'User not found'})
      }

      const process = async()=>{
          var fnResult = await bbService.checkPassword(req.body.password, userRecord.password);
          if(!fnResult)
          {
             return {error: 'error'};
          }
          else if(fnResult != true){
              return fnResult;
          }
          else if(fnResult == true){
              return{
                  user:userRecord,
                  token: jwToken.issue({
                      user: userRecord.id
                    }, '1d') //generate the token and send it in the response
              };
          }
      }
      process().then(res.ok)
      .catch(err=>util.errorResponse(err,res));

    },
    update: function (req, res) {
      //make sure jobBoard id is provided
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
      let userId = req.param('id');
  
      const updateUser = async() => {
  
        const oldUser = await User.count({
          id: userId
        });
  
        if (oldUser < 1) {
          return new CustomError('Invalid User  Id', {
            status: 403
          });
        }
  
        let user = {};
  
        if (req.param('first_name') != undefined && _.isString(req.param('first_name'))) {
          user.first_name = req.param('first_name');
        }
        if (req.param('email') != undefined && _.isNumber(req.param('email'))) {
          user.email = req.param('email');
        }
        if (req.param('mobile') != undefined && _.isString(req.param('mobile'))) {
          user.mobile = req.param('mobile');
        }
        if (req.param('status_id') != undefined && _.isString(req.param('status_id'))) {
          user.status_id = req.param('status_id');
        }
  
  
        const updatedUser = await User.update({
          id: userId
        }, user);
  
        if (updatedUser)
          return updatedUser;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      updateUser()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
    },
    delete: function (req, res) {
      //make sure jobBoard id is provided
      if (!req.param('id') || isNaN(req.param('id'))) {
        return res.badRequest("Id is required");
      }
  
      let userId = req.param('id');
  
      const deleteUser = async() => {
  
        const checkUser = await User.count({
          id: userId
        });
  
        if (checkUser < 1) {
          return new CustomError('Invalid User Id', {
            status: 403
          });
        }
  
  
        const deletedUser = await User.update({
          id: userId
        }, {
          status_id: Status.DELETED
        });
  
        if (deletedUser)
          return deletedUser;
        return new CustomError('Some error occurred. Please contact development team for help.', {
          status: 403
        });
  
  
      }
      deleteUser()
        .then(res.ok)
        .catch(err => util.errorResponse(err, res));
  
  
  
    }
}