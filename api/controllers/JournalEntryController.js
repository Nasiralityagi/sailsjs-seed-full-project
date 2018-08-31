/**
 * JournalEntryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var moment = require('moment');
module.exports = {

    create: function (req, res) {
        if (!req.param('date')) {
            return res.badRequest("date required");
        }
        if (!_.isNumber(req.param('entry_type'))) {
            return res.badRequest("entry_type required");
        }
        if (!req.param('status') || !_.isString(req.param('status'))) {
            return res.badRequest("status required");
        }
        if (!req.param('journalentryaccount')) {
            return res.badRequest("journalentryaccount required");
        }
        let reference_date;
        // var dateFormat = "DD/MM/YYYY";
        // moment("28/02/2011", dateFormat, true).isValid();
        if (req.param('reference_date') && moment(req.param('reference_date'), false).isValid()) {
            reference_date = moment(req.param('reference_date')).toDate();
        }
        let jesUserArr = req.param('journalentryaccount');
        if (jesUserArr.length <= 1) {
            return res.badRequest("journalentryaccount required");
        }
        let totalDebit = 0, totalCredit = 0;
        for (let key in jesUserArr) {
            totalDebit += jesUserArr[key].debit;
            totalCredit += jesUserArr[key].credit;
        }
        if (totalCredit !== totalDebit) {
            return res.json({ err: 'total credit is not equal to total debit.' });
        }

        const process = async () => {
            let newJournalEntry = null;
            if (_.isNumber(req.param('id')) && req.param('status') == 'Save') {
                const countJE = await JournalEntry.count({ where: { id: req.param('id'), status_id: Status.ACTIVE } });
                if (countJE >= 1) {
                    return { err: 'Record already submitted' };
                }
                newJournalEntry = await JournalEntry.update({
                    id: req.param('id')
                }).set(
                    {
                        'date': moment(req.param('date')).toDate(),
                        'entry_type': req.param('entry_type'),
                        'reference_number': req.param('reference_number'),
                        'reference_date': reference_date,
                        'user_remarks': req.param('user_remarks') || '',
                        'status_id': Status.PENDING,
                    }
                ).fetch();
            }
            else {
                newJournalEntry = await JournalEntry.findOrCreate({
                    id: req.param('id') || null
                },
                    {
                        'date': moment(req.param('date')).toDate(),
                        'entry_type': req.param('entry_type'),
                        'reference_number': req.param('reference_number'),
                        'reference_date': reference_date,
                        'user_remarks': req.param('user_remarks') || '',
                        'status_id': Status.PENDING,
                    });
            }
            if (newJournalEntry) {

                if (req.param('status') == 'Save') {
                    // console.log(newJournalEntry);
                    await JournalEntryAccount.destroy({ journalentry: newJournalEntry.id == undefined ? newJournalEntry[0].id : newJournalEntry.id });
                    for (let key in jesUserArr) {
                        await JournalEntryAccount.create({
                            'debit': jesUserArr[key].debit,
                            'credit': jesUserArr[key].credit,
                            'account': jesUserArr[key].account,
                            'journalentry': newJournalEntry.id == undefined ? newJournalEntry[0].id : newJournalEntry.id,
                            'status_id': Status.PENDING,
                            'createdBy': req.token.user.id, // current logged in user id
                        });
                    }
                    if (_.isNumber(req.param('id')))
                        return { msg: 'Your data is updated', id: newJournalEntry[0].id  };
                    else
                        return { msg: 'Your data is saved', id: newJournalEntry.id };
                }
                else if (req.param('status') == 'Submit') {
                    const countJE = await JournalEntry.count({ where: { id: req.param('id'), status_id: Status.ACTIVE } });
                    if (countJE >= 1) {
                        return { err: 'Record already submitted' };
                    }
                    await JournalEntry.update({ id: req.param('id') || null }).set({ status_id: Status.ACTIVE });
                    if (!req.param('id')) {
                        throw new CustomError('id is required');
                    }
                    const newJEA = await JournalEntryAccount.find({
                        where: { journalentry: req.param('id') }
                    });
                    for (let key in newJEA) {
                        if (newJEA[key].debit > 0 && newJEA[key].credit > 0) {
                            throw new CustomError({ err: 'can not credit and debit same account' });
                        }

                        const ale = await AccountLedgerEntry.find({
                            where: { account: newJEA[key].account },
                            sort: 'updatedAt DESC',
                            limit: 1
                        });
                        let against_account = null;

                        for (let j in newJEA) {
                            if (newJEA[key].debit <= 0 && newJEA[j].account != newJEA[key].account) {
                                if (newJEA[j].debit > 0) {
                                    const account = await Account.findOne({ id: newJEA[j].account });
                                    if (account) {
                                        against_account = against_account == null ?
                                            account.name : against_account + ' , ' + account.name;
                                    }
                                }
                            }
                            else if (newJEA[key].credit <= 0 && newJEA[j].account != newJEA[key].account) {
                                if (newJEA[j].credit > 0) {
                                    const account = await Account.findOne({ id: newJEA[j].account });
                                    if (account) {
                                        against_account = against_account == null ?
                                            account.name : against_account + ' , ' + account.name;
                                    }
                                }
                            }
                        }


                        let balance = 0;
                        if (ale.length == 0) {
                            balance = newJEA[key].debit - newJEA[key].credit
                        }
                        else {
                            balance = ale[0].balance + (newJEA[key].debit - newJEA[key].credit)
                        }
                        const newALE = await AccountLedgerEntry.create({
                            'date': newJournalEntry.date,
                            'account': newJEA[key].account,
                            'debit': newJEA[key].debit,
                            'credit': newJEA[key].credit,
                            'against_account': against_account == null ? '' : against_account,
                            'reference_type': req.param('reference_type') || '',
                            'balance': balance
                        });

                    }
                    return { msg: 'Your data is submitted', id: newJournalEntry.id };
                }
                else {
                    return { msg: 'Invalid Status' };
                }

            }
            else {
                throw new CustomError('Some error occurred. Please contact support team for help. ');
            }


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

        let queryObject = {
            where: { status_id: { '!=': Status.DELETED } },
            // limit: parseInt(params.per_page),
            sort: '',
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        queryObject.where.or = [{
            // 'user_remarks': {
            //     'like': '%' + params.query + '%'
            // }
        }];




        const getJournalEntry = async () => {

            const JournalEntry_count = await JournalEntry.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (JournalEntry_count < 1) {
                throw new CustomError('JournalEntry not found', {
                    status: 403
                });
            }
            let journalEntry = await JournalEntry.find(queryObject);
            if (journalEntry.length < 1) {
                throw new CustomError('JournalEntry not found', {
                    status: 403
                });
            }

            const responseObject = {
                journalEntry: journalEntry,
                totalCount: JournalEntry_count,
                perPage: params.per_page,
                currentPage: params.page
            };
            return responseObject;
        }

        getJournalEntry()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let JournalEntryId = req.param('id')
        let queryObject = {
            where: { id: JournalEntryId, status_id: { '!=': Status.DELETED } }
        };
        const getJournalEntry = async () => {
            let journalEntry = await JournalEntry.findOne(queryObject).populate('journalentryaccount');

            if (journalEntry) {
                journalEntry.date = moment(journalEntry.date).format('YYYY-MM-DD');
                journalEntry.reference_date = moment(journalEntry.reference_date).format('YYYY-MM-DD');
                return journalEntry;
            }
            else
                throw new CustomError('JournalEntry not found', {
                    status: 403
                });

        }

        getJournalEntry()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let JournalEntryId = req.param('id');

        const updateJournalEntry = async () => {

            const oldJournalEntry = await JournalEntry.count({
                id: JournalEntryId
            });

            if (oldJournalEntry < 1) {
                throw new CustomError('Invalid JournalEntry  Id', {
                    status: 403
                });
            }

            let account = {};

            if (req.param('name') != undefined && _.isString(req.param('name'))) {
                account.name = req.param('name');
            }
            if (req.param('root_type') != undefined && _.isNumber(req.param('root_type'))) {
                account.root_type = req.param('root_type');
            }
            if (req.param('account_type') != undefined && _.isNumber(req.param('account_type'))) {
                account.account_type = req.param('account_type');
            }
            if (req.param('is_group') != undefined && _.isBoolean(req.param('is_group'))) {
                account.is_group = req.param('is_group');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                account.status_id = req.param('status_id');
            }


            const updatedJournalEntry = await JournalEntry.update({
                id: JournalEntryId
            }, account).fetch();

            if (updatedJournalEntry)
                return updatedJournalEntry;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateJournalEntry()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let JournalEntryId = req.param('id');
        let queryObject = {
            where: { id: JournalEntryId, status_id: { '!=': Status.DELETED } }
        };
        const deleteJournalEntry = async () => {

            const checkJournalEntry = await JournalEntry.count(queryObject);

            if (checkJournalEntry < 1) {
                throw new CustomError('Invalid Document Id', {
                    status: 403
                });
            }

            const deleteJEA = await JournalEntryAccount.update({ journalentry: req.param('id') }).set({ status_id: Status.DELETED });
            const deletedJournalEntry = await JournalEntry.update({
                id: JournalEntryId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedJournalEntry)
                return deletedJournalEntry;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteJournalEntry()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    }
};