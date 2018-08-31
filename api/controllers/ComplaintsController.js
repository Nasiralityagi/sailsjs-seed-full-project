/**
 * ComplaintsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create: function (req, res) {

        if (!req.param('subject') || !_.isString(req.param('subject'))) {
            return res.badRequest("subject required");
        }

        if (!req.param('description') || !_.isString(req.param('description'))) {
            return res.badRequest("description required");
        }
        // if (!req.param('customer_id') || !_.isNumber(req.param('customer_id'))) {
        //     return res.badRequest("customer_id required");
        // }
        const process = async () => {

            const newComplaints = await Complaints.create({
                'subject': req.param('subject'),
                'description': req.param('description'),
                'customers': req.param('customer_id'),
                'registered_by': req.token.user.id, // current logged in user id
                'assigned_to': req.param('assigned_to'),
                'dealer': req.param('dealer_id'),
                'status_id': Status.ACTIVE,
                'createdBy': req.token.user.id, // current logged in user id
            }).fetch();

            if (newComplaints)
                return newComplaints;

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
                sort: 'subject',
                query: ''
            });

        var sortable = ['subject'];

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
            'subject': {
                'like': '%' + params.query + '%'
            }
        }];




        const getComplaints = async () => {

            const Complaints_count = await Complaints.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (Complaints_count < 1) {
                throw new CustomError('complaints not found', {
                    status: 403
                });
            }
            let complaints = await Complaints.find(queryObject).populate('customers');;
            if (complaints.length < 1) {
                throw new CustomError('complaints not found', {
                    status: 403
                });
            }
            const responseObject = {
                complaints: complaints,
                totalCount: Complaints_count,
                perPage: params.per_page,
                currentPage: params.page
            };
            return responseObject;
        }

        getComplaints()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let ComplaintsId = req.param('id')
        let queryObject = {
            where: { id: ComplaintsId, status_id: { '!=': Status.DELETED } }
        };
        const getComplaints = async () => {
            let complaints = await Complaints.findOne(queryObject).populate('customers');

            if (complaints)
                return complaints;
            else
                throw new CustomError('Complaints not found', {
                    status: 403
                });

            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getComplaints()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let ComplaintsId = req.param('id');

        const updateComplaints = async () => {

            const oldComplaints = await Complaints.count({
                id: ComplaintsId
            });

            if (oldComplaints < 1) {
                throw new CustomError('Invalid Complaints  Id', {
                    status: 403
                });
            }

            let complaints = {};

            if (req.param('subject') != undefined && _.isString(req.param('subject'))) {
                complaints.subject = req.param('subject');
            }
            if (req.param('description') != undefined && _.isString(req.param('description'))) {
                complaints.description = req.param('description');
            }
            if (req.param('customer_id') != undefined && _.isNumber(req.param('customer_id'))) {
                complaints.customers = req.param('customer_id');
            }
            if (req.param('registered_by') != undefined && _.isNumber(req.param('registered_by'))) {
                complaints.registered_by = req.param('registered_by');
            }
            if (req.param('assigned_to') != undefined && _.isNumber(req.param('assigned_to'))) {
                complaints.assigned_to = req.param('assigned_to');
            }
            if (req.param('dealer_id') != undefined && _.isNumber(req.param('dealer_id'))) {
                complaints.dealer = req.param('dealer_id');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                complaints.status_id = req.param('status_id');
            }


            const updatedComplaints = await Complaints.update({
                id: ComplaintsId
            }, complaints).fetch();

            if (updatedComplaints)
                return updatedComplaints;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateComplaints()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let ComplaintsId = req.param('id');
        let queryObject = {
            where: { id: ComplaintsId, status_id: { '!=': Status.DELETED } }
        };
        const deleteComplaints = async () => {

            const checkComplaints = await Complaints.count(queryObject);

            if (checkComplaints < 1) {
                throw new CustomError('Invalid complaints Id', {
                    status: 403
                });
            }


            const deletedComplaints = await Complaints.update({
                id: ComplaintsId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedComplaints)
                return deletedComplaints;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteComplaints()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    }
};