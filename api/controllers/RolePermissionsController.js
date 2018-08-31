/**
 * RolePermissionsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  create: async function (req, res) {

    if (!req.param('role_id') || !_.isNumber(req.param('role_id'))) {
      return res.badRequest('role_id required');
    }

    if (!req.param('menu') || !_.isObject(req.param('menu'))) {
      return res.badRequest('menu required');
    }
    const countRP = await RolePermissions.count({ roles: req.param('role_id') });
    // console.log(countRP);
    let newRolePermissions;
    if (countRP == 1) {
      newRolePermissions = await RolePermissions.update(
        { roles: req.param('role_id') }
      ).set({
        'menu': req.param('menu'),
      }).fetch();
    }
    else {
      newRolePermissions = await RolePermissions.create(
        {
          'roles': req.param('role_id'),
          'menu': req.param('menu'),
          'status_id': Status.ACTIVE,
        }).fetch();
    }
    if (newRolePermissions || newRolePermissions[0])
      return res.ok(newRolePermissions || newRolePermissions[0]);

    return res.notFound('Error occured while inserting data in rolePermissions');

  },
  find: async function (req, res) {
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
      where: { status_id: { '!=': Status.DELETED } },
      // limit: parseInt(params.per_page),
      sort: '',
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      // 'role_id': {
      //   'like': '%' + params.query + '%'
      // }
    }];



    const getRolePermissions = async () => {

      const RolePermissions_count = await RolePermissions.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (RolePermissions_count < 1) {
        throw new CustomError('RolePermissions not found', {
          status: 403
        });
      }
      let rolePermissions = await RolePermissions.find(queryObject).populate('roles');
      if (rolePermissions.length < 1) {
        throw new CustomError('RolePermissions not found', {
          status: 403
        });
      }
      const responseObject = {
        rolePermissions: rolePermissions,
        totalCount: RolePermissions_count,
        perPage: params.per_page,
        currentPage: params.page
      };
      return responseObject;
    }
    getRolePermissions()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  findOne: async function (req, res) {
    // try {
    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let RolePermissionsId = req.param('id');
    // console.log(rolePermissions);
    let queryObject = {
      where: { roles: RolePermissionsId, status_id: { '!=': Status.DELETED } }
    };
    // console.log(queryObject)
    const getRolePermissions = async () => {

      let rolePermissions = await RolePermissions.findOne(queryObject).populate('roles');
      // console.log(rolePermissions);
      if (!rolePermissions) {
        throw new CustomError('RolePermissions not found', {
          status: 403
        });
      }
      else
        return rolePermissions;
    }
    getRolePermissions()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  update: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest('Id is required');
    }
    let RolePermissionsId = req.param('id');


    const oldRolePermissions = await RolePermissions.count({
      id: RolePermissionsId
    });

    if (oldRolePermissions < 1) {
      return res.badRequest('Invalid rolePermissions id');
    }

    let rolePermissions = {};

    if (req.param('role_id') != undefined && _.isNumber(req.param('role_id'))) {
      rolePermissions.roles = req.param('role_id');
    }
    if (req.param('menu') != undefined && _.isObject(req.param('menu'))) {
      rolePermissions.menu = req.param('menu');
    }
    if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
      rolePermissions.status_id = req.param('status_id');
    }


    const updatedRolePermissions = await RolePermissions.update({
      id: RolePermissionsId
    }, rolePermissions).fetch();

    if (updatedRolePermissions)
      return res.ok(updatedRolePermissions);
    return res.notFound('rolePermissions updation error');



  },
  delete: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest('Id is required');
    }

    let RolePermissionsId = req.param('id');
    let queryObject = {
      where: { id: RolePermissionsId, status_id: { '!=': Status.DELETED } }
    };
    const checkRolePermissions = await RolePermissions.count(queryObject);

    if (checkRolePermissions < 1) {
      return res.badRequest('Invalid rolePermissions id');
    }

    const deletedRolePermissions = await RolePermissions.update({
      id: RolePermissionsId
    }, {
        status_id: Status.DELETED
      }).fetch();

    if (deletedRolePermissions)
      return res.ok(deletedRolePermissions);
    return res.notFound('Error while deleting record');
  }
};