/**
 * InvoicessController
 *
 * @packages :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
var fs = require('fs');
module.exports = {
    create: function (req, res) {

        if (!req.param('customers') || !_.isNumber(req.param('customers'))) {
            return res.badRequest("customers required");
        }

        // if (!req.param('packages') || !_.isNumber(req.param('packages'))) {
        //     return res.badRequest("packages required");
        // }
        if (!_.isNumber(req.param('total_price'))) {
            return res.badRequest("total_price required");
        }
        // if (!req.param('customer_id') || !_.isNumber(req.param('customer_id'))) {
        //     return res.badRequest("customer_id required");
        // }
        const process = async () => {

            const customer = await Customers.findOne({ id: req.param('customers') });
            const newInvoices = await Invoices.create({
                'customers': req.param('customers'),
                'total_price': req.param('total_price'),
                'paid_amount': 0,
                'package_price': req.param('package_price'),
                'packages': req.param('packages'),
                'status_id': Status.PENDING,
                'paid': false,
                'createdBy': customer.createdBy, // current logged in user id
            }).fetch();

            if (newInvoices) {
                if (req.param('stocks')) {
                    for (let s of req.param('stocks')) {
                        await InvoiceStock.create({
                            items: s.items,
                            warehouse: s.warehouse,
                            quantity: s.quantity,
                            price: s.price,
                            invoices: newInvoices.id,
                            createdBy: req.token.user.id, // current logged in user id
                        });
                        const inventory = await Inventory.find({
                            where: {
                                items: s.items, warehouse: s.warehouse, quantity: { '>': 0 }
                            }
                        }).limit(1);

                        if (inventory.length <= 0) {
                            await InvoiceStock.destroy({ invoices: newInvoices.id });
                            await Invoices.destroy({ id: newInvoices.id });
                            throw new CustomError('Inventory not found for item : ' + s.item.name + ' and warehouse : ' + s.warehouse.name, {
                                status: 403
                            });

                        }
                        const newStockOut = await StockOut.create({
                            'sale_price': s.price,
                            'sale_date': moment().toDate(),
                            'quantity': s.quantity,
                            'items': s.items,
                            'warehouse': s.warehouse,
                            'area': '',
                            'invoice_no': newInvoices.id,
                            'total': s.price * s.quantity,
                            'description': 'invoice',
                            'customers': customer.id,
                            'status_id': Status.ACTIVE,
                            'createdBy': req.token.user.id, // current logged in user id
                        }).fetch();
                        if (!newStockOut) {
                            await InvoiceStock.destroy({ invoices: newInvoices.id });
                            await Invoices.destroy({ id: newInvoices.id });
                        }
                        await Inventory.update(inventory[0])
                            .set({ quantity: inventory[0].quantity - s.quantity });

                    }

                }
                const input = {
                    account: customer.username,
                    credit: 0,
                    debit: newInvoices.total_price,
                    against_account: customer.username,
                    remarks: 'invoice payment debit for customer : ' + customer.first_name,
                    createdBy: customer.createdBy,
                }
                // the well helper will perform all the transion in all three account table.
                await sails.helpers.makeInvoicePayment(newInvoices.id, newInvoices.total_price, customer.createdBy == 1 ? 1 : 3, customer.createdBy)
                    .intercept('error', () => {
                        Invoices.destroy({ id: newInvoices.id });
                        throw new CustomError('Error while making payment', {
                            status: 403
                        });
                    });

                return newInvoices;
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
            where: {
                status_id: { '!=': Status.DELETED },
                createdBy: req.token.user.role.id == 2 ? req.token.user.id : undefined,
            },
            // limit: parseInt(params.per_page),

            sort: '',
        };
        if (params.sort && _.indexOf(sortable, params.sort) > -1) {
            queryObject.sort = params.sort + ' ' + params.sort_dir;
        }
        queryObject.where.or = [{
            // 'customers': {
            //     'like': '%' + params.query + '%'
            // }
        }];




        const getInvoices = async () => {

            const Invoices_count = await Invoices.count({
                where: {
                    status_id: { '!=': Status.DELETED },
                    createdBy: req.token.user.role.id == 2 ? req.token.user.id : undefined,
                }
            });
            if (Invoices_count < 1) {
                throw new CustomError('invoices not found', {
                    status: 403
                });
            }
            let invoices = await Invoices.find(queryObject).populate('customers');
            if (invoices.length < 1) {
                throw new CustomError('invoices not found', {
                    status: 403
                });
            }
            let invoiceArr = [];
            for (let i of invoices) {
                let data = {
                    id: i.id,
                    customer_name: i.customers.first_name,
                    customer_mobile: i.customers.mobile,
                    invoice_price: i.total_price,
                    invoice_date: moment(i.updatedAt).format('DD/MM/YYYY'),
                    paid: i.status_id == Status.PENDING ? 'Unpaid' : i.status_id == Status.PARTIAL_PAID ? 'Partial Paid' : 'Paid',
                }
                invoiceArr.push(data);
            }

            const responseObject = {
                invoices: invoiceArr,
                totalCount: Invoices_count,
                perPage: params.per_page,
                currentPage: params.page
            };
            return responseObject;
        }

        getInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let InvoicesId = req.param('id')
        let queryObject = {
            where: { id: InvoicesId, status_id: { '!=': Status.DELETED } }
        };
        const getInvoices = async () => {
            let invoices = await Invoices.findOne(queryObject).populate('packages').populate('customers').populate('invoicestock');

            if (invoices) {
                return invoices;
            }
            else
                throw new CustomError('Invoices not found', {
                    status: 403
                });

            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let InvoicesId = req.param('id');

        const updateInvoices = async () => {

            const oldInvoices = await Invoices.count({
                id: InvoicesId
            });

            if (oldInvoices < 1) {
                throw new CustomError('Invalid Invoices  Id', {
                    status: 403
                });
            }

            let invoices = {};
            // 'customers': req.param('customers'),
            // 'total_price': req.param('total_price'),
            // 'package_price': req.param('package_price'),
            // 'packages': req.param('packages'),
            if (req.param('customers') != undefined && _.isNumber(req.param('customers'))) {
                invoices.customers = req.param('customers');
            }
            if (req.param('packages') != undefined && _.isNumber(req.param('packages'))) {
                invoices.packages = req.param('packages');
            }
            if (req.param('package_price') != undefined && _.isNumber(req.param('package_price'))) {
                invoices.package_price = req.param('package_price');
            }
            if (req.param('total_price') != undefined && _.isNumber(req.param('total_price'))) {
                invoices.total_price = req.param('total_price');
            }
            if (req.param('paid') != undefined && _.isBoolean(req.param('paid'))) {
                invoices.paid = req.param('paid');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                invoices.status_id = req.param('status_id');
            }


            const updatedInvoices = await Invoices.update({
                id: InvoicesId
            }, invoices).fetch();

            if (updatedInvoices)
                return updatedInvoices;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let InvoicesId = req.param('id');
        let queryObject = {
            where: { id: InvoicesId, status_id: { '!=': Status.DELETED } }
        };
        const deleteInvoices = async () => {

            const checkInvoices = await Invoices.count(queryObject);

            if (checkInvoices < 1) {
                throw new CustomError('Invalid invoices Id', {
                    status: 403
                });
            }


            const deletedInvoices = await Invoices.update({
                id: InvoicesId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedInvoices)
                return deletedInvoices;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    },
    payment: function (req, res) {
        const infixToPrefix = require('infix-to-prefix');
        var Calculator = require('polish-notation'),
            calculator = new Calculator();
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        if (!req.param('paid_amount') || isNaN(req.param('paid_amount'))) {
            return res.badRequest("paid_amount is required");
        }


        let InvoicesId = req.param('id');

        let queryObject = {
            where: { id: InvoicesId, status_id: { '!=': Status.DELETED } }
        };

        const paymentInvoices = async () => {
            const invoice = await Invoices.findOne(queryObject).populate('customers').populate('packages');
            const paid_amount = invoice.paid_amount + req.param('paid_amount');
            if (!invoice) {
                throw new CustomError('Invalid invoices Id', {
                    status: 403
                });
            }
            let workflowArray = [];
            const workflow = await Workflow.find({
                where: { wf_number: invoice.customers.createdBy == 1 ? 2 : 4, status_id: { '!=': Status.DELETED } }
            }).populate('account');
            if (workflow.length < 1) {
                throw new CustomError('workflow record not found', {
                    status: 403
                });
            }
            else {
                const newJournalEntry = await JournalEntry.create(
                    {
                        'date': moment().toDate(),
                        'entry_type': 1,
                        'reference_number': 0,
                        'reference_date': moment().toDate(),
                        'user_remarks': 'invoice payment recieved of customer : ' + invoice.customers.first_name,
                        'status_id': Status.ACTIVE,
                    }).fetch();
                // await JournalEntry.findOne({
                //   name:newConnection.customers.username
                // });
                if (!newJournalEntry) {
                    await Invoices.update({
                        id: InvoicesId
                    }).set({ paid: false });
                    throw new CustomError('JournalEntry record insertion error', {
                        status: 403
                    });
                }
                for (let w of workflow) {
                    data = {};
                    data.journalentry = newJournalEntry.id;
                    if (w.account.id == 99) {
                        const connAccount = await Account.find({ where: { name: invoice.customers.username } }).limit(1);
                        data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
                    }
                    else if (w.account.id == 129) {
                        const dealer = await User.find({ id: invoice.customers.createdBy }).limit(1);
                        if (dealer.length > 0) {
                            const connAccount = await Account.find({ where: { name: dealer[0].username } }).limit(1);
                            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
                        }
                        else
                            data.account = w.account.id
                    }
                    else if (w.account.id == 128) {

                        const connAccount = await Account.find({ where: { name: req.token.user.username } }).limit(1);
                        data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;

                    }
                    else
                        data.account = w.account.id
                    let formulaString = w.credit == '0' ? infixToPrefix(w.debit) : infixToPrefix(w.credit);
                    let dealerPackages = await DealerPackages.findOne({
                        where: {
                            dealer: invoice.customers.createdBy,
                            packages: invoice.packages != null ? invoice.packages.id : null, status_id: { '!=': Status.DELETED },
                        }
                    });
                    let variableArr = formulaString.split(' ');
                    for (let v of variableArr) {
                        switch (v) {
                            case 'amount':
                                formulaString = formulaString.replace('amount', req.param('paid_amount'));
                                break;
                            case 'company_cost_price':
                                formulaString = formulaString.replace('company_cost_price', invoice.packages != null ? invoice.packages.cost_price : 0);
                                break;
                            case 'company_retail_price':
                                formulaString = formulaString.replace('company_retail_price', invoice.packages != null ? invoice.packages.retail_price : 0);
                                break;
                            case 'dealer_cost_price':
                                formulaString = formulaString.replace('dealer_cost_price', !dealerPackages ? 0 : dealerPackages.price);
                                break;
                            case 'dealer_retail_price':
                                formulaString = formulaString.replace('dealer_retail_price', !dealerPackages ? 0 : dealerPackages.retail_price);
                                break;

                            default:
                                break;
                        }
                    }
                    // console.log('formulaString', formulaString);

                    let credit = w.credit.trim();
                    let debit = w.debit.trim();
                    data.credit = credit == '0' ? credit : calculator.calculate(formulaString);
                    data.debit = debit == '0' ? debit : calculator.calculate(formulaString);
                    data.credit = parseInt(data.credit);
                    data.debit = parseInt(data.debit);

                    workflowArray.push(data);

                }
                // console.log('workflowArray', workflowArray);
                for (let key in workflowArray) {
                    // console.log(workflowArray[key] , newJournalEntry.id);
                    const newJournalEntryAccount = await JournalEntryAccount.create({
                        'debit': workflowArray[key].debit,
                        'credit': workflowArray[key].credit,
                        'account': workflowArray[key].account,
                        'journalentry': newJournalEntry.id,
                        'status_id': Status.ACTIVE,
                        'createdBy': req.token.user.id, // current logged in user id
                    }).fetch();

                    const ale = await AccountLedgerEntry.find({
                        where: { account: workflowArray[key].account },
                        sort: 'updatedAt DESC',
                        limit: 1
                    });
                    let against_account = null;

                    for (let j of workflowArray) {
                        // console.log(j);
                        if (workflowArray[key].debit <= 0 && j.account != workflowArray[key].account) {
                            if (j.debit > 0) {
                                const account = await Account.findOne({ id: j.account });
                                if (account) {
                                    against_account = against_account == null ?
                                        account.name : against_account + ' , ' + account.name;
                                }
                                // console.log(against_account)
                            }
                        }
                        else if (workflowArray[key].credit <= 0 && j.account != workflowArray[key].account) {
                            if (j.credit > 0) {
                                const account = await Account.findOne({ id: j.account });
                                if (account) {
                                    against_account = against_account == null ?
                                        account.name : against_account + ' , ' + account.name;
                                }
                                // console.log(against_account)
                            }
                        }
                    }


                    let balance = 0;
                    if (ale.length == 0) {
                        balance = workflowArray[key].debit - workflowArray[key].credit
                    }
                    else {
                        balance = ale[0].balance + (workflowArray[key].debit - workflowArray[key].credit)
                    }
                    const newALE = await AccountLedgerEntry.create({
                        'date': newJournalEntry.date,
                        'account': workflowArray[key].account,
                        'debit': workflowArray[key].debit,
                        'credit': workflowArray[key].credit,
                        'against_account': against_account == null ? '' : against_account,
                        'reference_type': '',
                        'description': newJournalEntry.user_remarks,
                        'balance': balance,
                        'createdBy': req.token.user.id, // current logged in user id
                    }).fetch();
                    if (!newALE) {
                        await Invoices.update({
                            id: InvoicesId
                        }).set({ paid: false });
                        await JournalEntryAccount.destroy({ id: newJournalEntryAccount.id });
                        throw new CustomError('Account Ledger insertion error.', {
                            status: 403
                        });
                    }
                    else {
                        const connection = await Connection.findOne({ customers: invoice.customers.id });
                        if (connection) {
                            let queryObject = {
                                where: { connection: connection.id, status_id: { '!=': Status.DELETED } },
                                sort: ['expiration_date DESC'],
                                limit: 1,
                            };
                            let connRenewal = await ConnRenewal.find(queryObject);
                            if (connRenewal.length > 0) {
                                if (connRenewal[0].status_id == Status.UNPAID) {
                                    await ConnRenewal.update({ id: connRenewal[0].id }).set({ status_id: Status.PAID });
                                }

                            }
                        }
                    }
                    // console.log('data inserted in ledger ', newALE);

                }
            }
            await Invoices.update({
                id: InvoicesId
            }).set({
                paid: paid_amount >= invoice.total_price ? true : false,
                paid_amount: paid_amount,
                status_id: paid_amount >= invoice.total_price ? Status.PAID : Status.PARTIAL_PAID
            });

            return 'Payment made successfully'
        }
        paymentInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    customerForInvoice: function (req, res) {

        const customerInvoices = async () => {

            // const invoice = await Invoices.find(queryObject);
            // let customerArr = [];
            // for (const i of invoice) {
            //     customerArr.push(i.customers);
            // }
            const cv = await CustomerVerify.find({ where: { doc_type: CustomerVerify.MOBILE, is_verified: true }, select: ['customers'] });
            let cvArr = [];
            for (const c of cv) {
                cvArr.push(c.customers);
            }
            const customer = await Customers.find({
                where: {
                    id: { in: cvArr },
                    status_id: { '!=': Status.DELETED },
                    createdBy: req.token.user.role.id == 2 ? req.token.user.id : undefined
                }
            }).populate('createdBy');
            if (customer.length < 1) {
                throw new CustomError('Customers not found', {
                    status: 403
                });
            }

            const responseObject = {
                customers: customer
            };
            return responseObject;


        }
        customerInvoices()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    isPackage: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let invoiceId = req.param('invoiceId');
        let customer_id = req.param('id');
        let queryObject = {
            where: { id: invoiceId, customers: customer_id, status_id: { '!=': Status.DELETED } }
        };
        const ispackage = async () => {

            const invoice = await Invoices.find(queryObject);
            if (invoice.length > 0) {
                let status = false;
                for (const i of invoice) {

                    if (i.packages !== null) {
                        status = true;
                        break;
                    }
                }
                return status;
            }
            else {
                return false;
            }


        }
        ispackage()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    print: async function (req, res) {

        if (fs.existsSync('./assets/files/invoice/' + req.body.invoiceId + '.pdf')) {
            const file = filePath.fileUrl('./assets/files/invoice/' + req.body.invoiceId + '.pdf');
            return res.ok(file);
        }
        var data = {
            template: { 'shortid': 'rkJTnK2ce' },
            options: {
                preview: true,
                // reports: { "async": true },
                reports: { "save": false }



            },
            data: req.body,

        }
        var options = {
            // uri: 'https://hl.jsreportonline.net/api/report',
            uri: 'http://' + sails.config.Host + ':5488/api/report',
            method: 'POST',
            json: data,

        }
        await util.jsreport(options, req.body.invoiceId).then(() => {
            setTimeout(function () {
                const file = filePath.fileUrl('./assets/files/invoice/' + req.body.invoiceId + '.pdf');
                return res.ok(file);
            }, 2000);
        },
            reject => {
                return res.badRequest('jsreprot error');
            }
        );




    },

};

