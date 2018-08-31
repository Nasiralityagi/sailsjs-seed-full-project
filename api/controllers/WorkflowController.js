/**
 * WorkflowController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create: async function (req, res) {

        if (!_.isNumber(req.param('wf_number'))) {
            return res.badRequest("wf_number required");
        }

        if (!req.param('debit') || !_.isString(req.param('debit'))) {
            return res.badRequest("debit required");
        }
        if (!req.param('credit') || !_.isString(req.param('credit'))) {
            return res.badRequest("credit required");
        }
        if (!req.param('account') || !_.isNumber(req.param('account'))) {
            return res.badRequest("account required");
        }
        let credit = req.param('credit'), debit = req.param('debit');

        const newWorkflow = await Workflow.create({
            'wf_number': req.param('wf_number'),
            'debit': debit,
            'credit': credit,
            'account': req.param('account'),
            'status_id': Status.ACTIVE,
            'createdBy': req.token.user.id, // current logged in user id
        }).fetch();

        if (newWorkflow)
            return res.ok(newWorkflow);
        return res.notFound('Error occured while inserting workflow data');


    },
    createMultiple: async function (req, res) {

        var randomnumber = Math.floor(Math.random() * 10000) + 1;
        if (!req.param('dataArray') || !_.isArray(req.param('dataArray'))) {
            return res.badRequest("dataArray required");
        }

        for (let d of req.param('dataArray')) {

            // let credit = '0', debit = '0';
            // if (d.debit !== '0') {
            //     debit = d.debit;
            // }
            // else {
            //     credit = d.credit;
            // }

            const newWorkflow = await Workflow.create({
                'wf_number': randomnumber,
                'debit': d.debit,
                'credit': d.credit,
                'account': d.account,
                'status_id': Status.ACTIVE,
                'createdBy': req.token.user.id, // current logged in user id
            }).fetch();
            if (!newWorkflow) {
                return res.notFound('Error occured while inserting workflow data');
            }
        }
        return res.ok('workflow inserted successfully');

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

        let queryObject = {
            where: { status_id: { '!=': Status.DELETED } },
            // limit: parseInt(params.per_page),
            sort: '',
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        queryObject.where.or = [{
            // 'wf_number': {
            //   'like': '%' + params.query + '%'
            // }
        }];




        const getWorkflow = async () => {

            const Workflow_count = await Workflow.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (Workflow_count < 1) {
                throw new CustomError('workflow not found', {
                    status: 403
                });
            }
            let workflow = await Workflow.find(queryObject).populate('account');;
            if (workflow) {

                const responseObject = {
                    workflow: workflow,
                    totalCount: Workflow_count,
                    // perPage: params.per_page,
                    // currentPage: params.page
                };
                return responseObject;

            }
            throw new CustomError('workflow not found', {
                status: 403
            });
        }

        getWorkflow()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let WorkflowId = req.param('id')
        let queryObject = {
            where: { id: WorkflowId, status_id: { '!=': Status.DELETED } }
        };
        const getWorkflow = async () => {
            let workflow = await Workflow.findOne(queryObject).populate('account');

            if (workflow)
                return workflow;
            else
                throw new CustomError('Workflow not found', {
                    status: 403
                });

            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getWorkflow()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let WorkflowId = req.param('id');

        const updateWorkflow = async () => {

            const oldWorkflow = await Workflow.count({
                id: WorkflowId
            });

            if (oldWorkflow < 1) {
                throw new CustomError('Invalid Workflow  Id', {
                    status: 403
                });
            }

            let workflow = {};

            if (req.param('wf_number') != undefined && _.isNumber(req.param('wf_number'))) {
                workflow.wf_number = req.param('wf_number');
            }
            if (req.param('debit') != undefined && _.isString(req.param('debit'))) {
                workflow.debit = req.param('debit');
            }
            if (req.param('credit') != undefined && _.isString(req.param('credit'))) {
                workflow.credit = req.param('credit');
            }
            if (req.param('account') != undefined && _.isNumber(req.param('account'))) {
                workflow.account = req.param('account');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                workflow.status_id = req.param('status_id');
            }


            const updatedWorkflow = await Workflow.update({
                id: WorkflowId
            }, workflow).fetch();

            if (updatedWorkflow)
                return updatedWorkflow;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateWorkflow()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let WorkflowId = req.param('id');
        let queryObject = {
            where: { id: WorkflowId, status_id: { '!=': Status.DELETED } }
        };
        const deleteWorkflow = async () => {

            const checkWorkflow = await Workflow.count(queryObject);

            if (checkWorkflow < 1) {
                throw new CustomError('Invalid Workflow Id', {
                    status: 403
                });
            }


            const deletedWorkflow = await Workflow.update({
                id: WorkflowId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedWorkflow)
                return deletedWorkflow;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteWorkflow()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    }
};