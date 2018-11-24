
// this controller is created for LoginManager because of mess code in connection Controller

module.exports = {
    changePasswordList: async function (req, res) {
        var params = req.allParams(),
            params = _.defaults(params, {
                filters: [],
                page: 1,
                per_page: 20,
                sort_dir: 'DESC',
                sort: 'updatedAt',
                query: ''
            });

        var sortable = ['updatedAt'];

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
            where: { status_id: Status.PENDING, },
            // limit: parseInt(params.per_page),
            sort: '',
            limit: 1
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        // queryObject.where.or = [{
        //     'updatedAt': {
        //         'like': '%' + params.query + '%'
        //     },
        // }];

        const getConnection = async () => {


            const changePassword = await ChangePassword.find(queryObject);
            if (changePassword.length < 1) {
                return changePassword;
            }
            // new code
            const connection = await Connection.findOne({
                id: changePassword[0].connection,
                status_id: { in: [Status.ACTIVE, Status.INACTIVE], nin: [Status.DELETED, Status.IN_REVIEW] },
                doc_verified: true,
                in_review: false
            }).populate('customers').populate('packages')
                .populate('salesman').populate('dealer');
            if (!connection) {
                throw new CustomError('connection not found', {
                    status: 403
                });
            }
            let countConn = await ChangePassword.count({ where: { status_id: Status.PENDING } });
            connection.changePasswordId = changePassword[0].id;
            connection.old_password = changePassword[0].old_password;
            connection.new_password = changePassword[0].new_password;
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

        getConnection()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    changeMacList: async function (req, res) {
        var params = req.allParams(),
            params = _.defaults(params, {
                filters: [],
                page: 1,
                per_page: 20,
                sort_dir: 'DESC',
                sort: 'updatedAt',
                query: ''
            });

        var sortable = ['updatedAt'];

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
            where: { status_id: Status.PENDING, },
            // limit: parseInt(params.per_page),
            sort: '',
            limit: 1
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        // queryObject.where.or = [{
        //     'updatedAt': {
        //         'like': '%' + params.query + '%'
        //     },
        // }];

        const getConnection = async () => {


            const clearMac = await ChangeMac.find(queryObject);
            if (clearMac.length < 1) {
                return clearMac;
            }

            // new code
            const connection = await Connection.findOne({
                id: clearMac[0].connection,
                status_id: { in: [Status.ACTIVE], nin: [Status.DELETED, Status.IN_REVIEW] },
                doc_verified: true,
                in_review: false
            }).populate('customers').populate('packages')
                .populate('salesman').populate('dealer');
            if (!connection) {
                throw new CustomError('connection not found', {
                    status: 403
                });
            }
            let countConn = await ChangeMac.count({ where: { status_id: Status.PENDING } });
            connection.clearMacId = clearMac[0].id;
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

        getConnection()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    verifyChangePassword: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let changePasswordId = req.param('id');

        const verifyChangePassword = async () => {
            const verifyChangePasswordC = await ChangePassword.update({
                id: changePasswordId
            }, {
                    status_id: Status.ACTIVE,
                }).fetch();
            if (verifyChangePasswordC.length > 0) {
                const connection = await Connection.findOne({ id: verifyChangePasswordC[0].connection });
                await Customers.update({ id: connection.customers })
                    .set({ password: verifyChangePasswordC[0].new_password });
                if (req.param('status') != req.param('requested_status')) {
                    await Connection.update({ id: verifyChangePasswordC[0].connection })
                        .set({
                            status_id: req.param('requested_status'),
                            requested_status_id: req.param('status') == 17 ? 16 : req.param('status'),                        });
                }
                return 'Password Changed Successfully.'
            }
            else {
                throw new CustomError('Error while password updation.', {
                    status: 403
                });
            }
        }
        verifyChangePassword()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    verifyChangeMac: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let changeMacId = req.param('id');

        const verifyChangeMac = async () => {
            const verifyChangeMacC = await ChangeMac.update({
                id: changeMacId
            }, {
                    // invoiceCount > 0 ? Status.ACTIVE : Status.PENDING,
                    status_id: Status.ACTIVE,
                }).fetch();
            if (verifyChangeMacC.length > 0) {
                return 'Changed MAC Successfully.'
            }
            else {
                throw new CustomError('Error while pasword updation.', {
                    status: 403
                });
            }
        }
        verifyChangeMac()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    changePackageList: async function (req, res) {
        var params = req.allParams(),
            params = _.defaults(params, {
                filters: [],
                page: 1,
                per_page: 20,
                sort_dir: 'DESC',
                sort: 'updatedAt',
                query: ''
            });

        var sortable = ['updatedAt'];

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
            where: { status_id: Status.PENDING, },
            // limit: parseInt(params.per_page),
            sort: '',
            limit: 1
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        // queryObject.where.or = [{
        //     'updatedAt': {
        //         'like': '%' + params.query + '%'
        //     },
        // }];

        const getConnection = async () => {


            const changePackage = await ChangePackage.find(queryObject).populate('new_package');
            if (changePackage.length < 1) {
                return changePackage;
            }

            // new code
            const connection = await Connection.findOne({
                id: changePackage[0].connection,
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
            let countConn = await ChangePackage.count({ where: { status_id: Status.PENDING } });
            connection.changePackageId = changePackage[0].id;
            connection.new_package = changePackage[0].new_package;
            connection.connection_price = changePackage[0].connection_price;
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

        getConnection()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    verifyChangePackage: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let changePackageId = req.param('id');

        const verifyChangePackage = async () => {
            const verifyChangePackage = await ChangePackage.update({
                id: changePackageId
            }, {
                    // invoiceCount > 0 ? Status.ACTIVE : Status.PENDING,
                    status_id: Status.ACTIVE,
                }).fetch();
            if (verifyChangePackage.length > 0) {
                await Connection.update({ id: verifyChangePackage[0].connection })
                    .set({
                        status_id: Status.ACTIVE,
                        packages: verifyChangePackage[0].new_package,
                        connection_price: verifyChangePackage[0].connection_price,
                    });
                return 'Changed Package Successfully.'
            }
            else {
                throw new CustomError('Error while changing package.', {
                    status: 403
                });
            }
        }
        verifyChangePackage()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
}