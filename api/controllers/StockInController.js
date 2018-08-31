/**
 * StockInController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
module.exports = {

    create: async function (req, res) {

        if (!req.param('cost_price') || !_.isNumber(req.param('cost_price'))) {
            return res.badRequest("cost_price required");
        }
        if (!req.param('quantity') || !_.isNumber(req.param('quantity'))) {
            return res.badRequest("quantity required");
        }
        if (!req.param('item_id') || !_.isNumber(req.param('item_id'))) {
            return res.badRequest("item_id required");
        }
        if (!req.param('warehouse_id') || !_.isNumber(req.param('warehouse_id'))) {
            return res.badRequest("warehouse_id required");
        }
        if (!req.param('purchase_date')) {
            return res.badRequest("purchase_date required");
        }
        const inventory = await Inventory.findOrCreate(
            { warehouse: req.param('warehouse_id'), items: req.param('item_id') },
            { warehouse: req.param('warehouse_id'), items: req.param('item_id'), quantity: req.param('quantity') }
        );
        const process = async () => {

            const newStockIn = await StockIn.create({
                'cost_price': req.param('cost_price'),
                'purchase_date': moment(req.param('purchase_date')).toDate(),
                'quantity': req.param('quantity'),
                'invoice_no': req.param('invoice_no'),
                'cargo_service': req.param('cargo_service'),
                'bilty_no': req.param('bilty_no'),
                'supplier': req.param('supplier_id'),
                'items': req.param('item_id'),
                'warehouse': req.param('warehouse_id'),
                'status_id': Status.ACTIVE,
                'createdBy': req.token.user.id, // current logged in user id
            }).fetch();
            if (newStockIn) {
                let updateInventory = {};
                if (inventory) {
                    updateInventory = await Inventory.update(inventory)
                        .set({ quantity: inventory.quantity + req.param('quantity') }).fetch();
                }
                if (updateInventory) {
                    return newStockIn;
                }
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
                sort: 'cost_price',
                query: ''
            });

        var sortable = ['cost_price'];

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
            'cost_price': {
                'like': '%' + params.query + '%'
            }
        }];




        const getStockIn = async () => {

            const StockIn_count = await StockIn.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (StockIn_count < 1) {
                throw new CustomError('stockIn not found', {
                    status: 403
                });
            }
            let stockIn = await StockIn.find(queryObject).populate('items')
                .populate('warehouse').populate('supplier');
            if (stockIn) {

                for (let key in stockIn) {
                    if (stockIn[key].supplier != null)
                        stockIn[key].supplier = stockIn[key].supplier.first_name;
                    if (stockIn[key].items != null)
                        stockIn[key].items = stockIn[key].items.name;
                    if (stockIn[key].warehouse != null)
                        stockIn[key].warehouse = stockIn[key].warehouse.name;
                }

                const responseObject = {
                    stockIn: stockIn,
                    totalCount: StockIn_count,
                    perPage: params.per_page,
                    currentPage: params.page
                };
                return responseObject;
            }
            throw new CustomError('stockIn not found', {
                status: 403
            });
        }

        getStockIn()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let StockInId = req.param('id')
        let queryObject = {
            where: { id: StockInId, status_id: { '!=': Status.DELETED } }
        };
        const getStockIn = async () => {
            let stockIn = await StockIn.findOne(queryObject).populate('items')
                .populate('warehouse').populate('supplier');

            if (stockIn) {
                if (stockIn.supplier != null)
                    stockIn.supplier = stockIn.supplier.first_name;
                if (stockIn.items != null)
                    stockIn.items = stockIn.items.name;
                if (stockIn.warehouse != null)
                    stockIn.warehouse = stockIn.warehouse.name;
                return stockIn;
            }
            else
                throw new CustomError('StockIn not found', {
                    status: 403
                });

            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getStockIn()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let StockInId = req.param('id');

        const updateStockIn = async () => {

            const oldStockIn = await StockIn.count({
                id: StockInId
            });

            if (oldStockIn < 1) {
                throw new CustomError('Invalid StockIn  Id', {
                    status: 403
                });
            }

            let stockIn = {};

            if (req.param('cost_price') != undefined && _.isNumber(req.param('cost_price'))) {
                stockIn.cost_price = req.param('cost_price');
            }
            if (req.param('purchase_date') != undefined && _.isDate(req.param('purchase_date'))) {
                stockIn.purchase_date = moment(req.param('purchase_date')).toDate();
            }
            if (req.param('item_id') != undefined && _.isNumber(req.param('item_id'))) {
                stockIn.items = req.param('item_id');
            }
            if (req.param('warehouse_id') != undefined && _.isNumber(req.param('warehouse_id'))) {
                stockIn.warehouse = req.param('warehouse_id');
            }
            if (req.param('quantity') != undefined && _.isNumber(req.param('quantity'))) {
                stockIn.quantity = req.param('quantity');
            }
            if (req.param('invoice_no') != undefined && _.isString(req.param('invoice_no'))) {
                stockIn.invoice_no = req.param('invoice_no');
            }
            if (req.param('cargo_service') != undefined && _.isString(req.param('cargo_service'))) {
                stockIn.cargo_service = req.param('cargo_service');
            }
            if (req.param('bilty_no') != undefined && _.isString(req.param('bilty_no'))) {
                stockIn.bilty_no = req.param('bilty_no');
            }
            if (req.param('supplier_id') != undefined && _.isNumber(req.param('supplier_id'))) {
                stockIn.supplier = req.param('supplier_id');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                stockIn.status_id = req.param('status_id');
            }

            const updatedStockIn = await StockIn.update({
                id: StockInId
            }, stockIn).fetch();

            if (updatedStockIn)
                return updatedStockIn;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateStockIn()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let StockInId = req.param('id');
        let queryObject = {
            where: { id: StockInId, status_id: { '!=': Status.DELETED } }
        };
        const deleteStockIn = async () => {

            const checkStockIn = await StockIn.count(queryObject);

            if (checkStockIn < 1) {
                throw new CustomError('Invalid Document Id', {
                    status: 403
                });
            }


            const deletedStockIn = await StockIn.update({
                id: StockInId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedStockIn)
                return deletedStockIn;
            throw new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteStockIn()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    }
};
