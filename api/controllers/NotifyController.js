/**
 * NotifyController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var CronJob = require('cron').CronJob;
var jobs = [];
module.exports = {

    create: function (req, res) {

        if (!req.param('expires_in') || !_.isNumber(req.param('expires_in'))) {
            return res.badRequest("expires_in required");
        }

        if (!req.param('cron_job_time') || !_.isString(req.param('cron_job_time'))) {
            return res.badRequest("cron_job_time required");
        }
        let cronTime = req.param('cron_job_time').split(':');
        let hour;
        let mintes;
        if(cronTime.length == 2){
           hour = cronTime[0];
           mintes = cronTime[1];
        }
        let cronJob = mintes + ' ' + hour + ' * * *' 
        // return res.json({hour , mintes});
        const process = async () => {

            const newNotify = await Notify.create({
                'expires_in': req.param('expires_in'),
                'cron_job_time': cronJob,
                'status_id': Status.ACTIVE,
            }).fetch();

            if (newNotify) {
                // jobs[newNotify.id]= new CronJob({
                //     cronTime:newNotify.cron_job_time, //'* * * * *',
                //     onTick: function() {
                //       console.log('job '+ newNotify.id +' ticked ' + newNotify.expires_in);
                //     },
                //     start: true,
                //     timeZone: 'America/Los_Angeles'
                //   });
                //   jobs[newNotify.id].start();
                util.cronStart(newNotify.id, newNotify.cron_job_time, newNotify.expires_in);

                return newNotify;
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
                sort: 'expires_in',
                query: ''
            });

        var sortable = ['expires_in'];

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
            'expires_in': {
                'like': '%' + params.query + '%'
            }
        }];




        const getNotify = async () => {

            const Notify_count = await Notify.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (!Notify_count) {
                return new CustomError('document not found', {
                    status: 403
                });
            }
            let notify = await Notify.find(queryObject);
            if (!notify) {
                return new CustomError('document not found', {
                    status: 403
                });
            }
            const responseObject = {
                notify: notify,
                totalCount: Notify_count,
                perPage: params.per_page,
                currentPage: params.page
            };
            return responseObject;
        }

        getNotify()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let NotifyId = req.param('id')
        let queryObject = {
            where: { id: NotifyId, status_id: { '!=': Status.DELETED } }
        };
       
        const getNotify = async () => {
            let notify = await Notify.findOne(queryObject);

            if (notify)
                return notify;
            else
                return new CustomError('Notify not found', {
                    status: 403
                });

            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getNotify()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let NotifyId = req.param('id');

        const updateNotify = async () => {

            const oldNotify = await Notify.count({
                id: NotifyId
            });

            if (oldNotify < 1) {
                return new CustomError('Invalid Notify  Id', {
                    status: 403
                });
            }

            let notify = {};

            if (req.param('expires_in') != undefined && _.isNumber(req.param('expires_in'))) {
                notify.expires_in = req.param('expires_in');
            }
            if (req.param('cron_job_time') != undefined && _.isNumber(req.param('cron_job_time'))) {
                notify.cron_job_time = req.param('cron_job_time');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                notify.status_id = req.param('status_id');
            }


            const updatedNotify = await Notify.update({
                id: NotifyId
            }, notify).fetch();

            if (updatedNotify)
                return updatedNotify;
            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateNotify()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let NotifyId = req.param('id');
        let queryObject = {
            where: { id: NotifyId, status_id: { '!=': Status.DELETED } }
        };
        const deleteNotify = async () => {

            const checkNotify = await Notify.count(queryObject);

            if (checkNotify < 1) {
                return new CustomError('Invalid Document Id', {
                    status: 403
                });
            }


            const deletedNotify = await Notify.update({
                id: NotifyId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedNotify)
                return deletedNotify;
            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });

        }
        deleteNotify()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },

    stopCron: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let NotifyId = req.param('id');
        let queryObject = {
            where: { id: NotifyId }
        };
        const stopNotify = async () => {

            const checkNotify = await Notify.count(queryObject);

            if (checkNotify < 1) {
                return new CustomError('Invalid Id', {
                    status: 403
                });
            }
            if (util.cronStop(NotifyId)) {
                return ' Job id ' + NotifyId + ' stopped';
            }
            else {
                return 'error occured';
            }

        }
        stopNotify()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    }
};
