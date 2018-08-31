/**
 * DocumentsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  create: async function (req, res) {

    if (!req.param('file_name') || !_.isString(req.param('file_name'))) {
      return res.badRequest('file_name required');
    }

    if (!req.param('file_path') || !_.isString(req.param('file_path'))) {
      return res.badRequest('file_path required');
    }

    const newDocuments = await Documents.create({
      'file_name': req.param('file_name'),
      'file_path': req.param('file_path'),
      'customers': req.param('customer_id'),
      'status_id': Status.ACTIVE,
      'createdBy': req.token.user.id, // current logged in user id
    }).fetch();

    if (newDocuments)
      return res.ok(newDocuments);

    return res.notFound('Error occured while inserting data in document');

  },
  find: async function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'ASC',
        sort: 'file_name',
        query: ''
      });

    var sortable = ['file_name'];

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
      'file_name': {
        'like': '%' + params.query + '%'
      }
    }];




    const Documents_count = await Documents.count({ where: { status_id: { '!=': Status.DELETED } } });
    if (!Documents_count) {
      return res.notFound('document not found');
    }
    let document = await Documents.find(queryObject);
    if (!document) {
      return res.notFound('document not found');
    }
    const responseObject = {
      document: document,
      totalCount: Documents_count,
      perPage: params.per_page,
      currentPage: params.page
    };
    return res.ok(responseObject);

  },
  findOne: async function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let DocumentsId = req.param('id')
    let queryObject = {
      where: { id: DocumentsId, status_id: { '!=': Status.DELETED } }
    };
    let document = await Documents.findOne(queryObject);

    if (document)
      return res.ok(document);
    else
      return res.notFound('document not found');

  },
  update: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest('Id is required');
    }
    let DocumentsId = req.param('id');


    const oldDocuments = await Documents.count({
      id: DocumentsId
    });

    if (oldDocuments < 1) {
      return res.badRequest('Invalid document id');
    }

    let document = {};

    if (req.param('file_name') != undefined && _.isString(req.param('file_name'))) {
      document.file_name = req.param('file_name');
    }
    if (req.param('file_path') != undefined && _.isString(req.param('file_path'))) {
      document.file_path = req.param('file_path');
    }
    if (req.param('customer_id') != undefined && _.isNumber(req.param('customer_id'))) {
      document.customers = req.param('customer_id');
    }
    if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
      document.status_id = req.param('status_id');
    }


    const updatedDocuments = await Documents.update({
      id: DocumentsId
    }, document).fetch();

    if (updatedDocuments)
      return res.ok(updatedDocuments);
    return res.notFound('document updation error');



  },
  delete: async function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest('Id is required');
    }

    let DocumentsId = req.param('id');
    let queryObject = {
      where: { id: DocumentsId, status_id: { '!=': Status.DELETED } }
    };
    const checkDocuments = await Documents.count(queryObject);

    if (checkDocuments < 1) {
      return res.badRequest('Invalid document id');
    }

    const deletedDocuments = await Documents.update({
      id: DocumentsId
    }, {
        status_id: Status.DELETED
      }).fetch();

    if (deletedDocuments)
      return res.ok(deletedDocuments);
    return res.notFound('Error while deleting record');
  }
};