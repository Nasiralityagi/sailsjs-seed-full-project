/**
 * StockOutController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
module.exports = {

    create: async function (req, res) {

        if (!req.param('sale_price') || !_.isNumber(req.param('sale_price'))) {
            return res.badRequest("sale_price required");
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
        if (!req.param('sale_date')) {
            return res.badRequest("sale_date required");
        }
        let customer = null, dealer = null, supplier = null;
        if (req.param('client_type') && req.param('client_id')) {
            switch (req.param('client_type')) {
                case 0:
                    dealer = req.param('client_id');
                    break;
                case 1:
                    customer = req.param('client_id');
                    break;
                case 2:
                    supplier = req.param('client_id');
                    break;
                default:
                    break;
            }
        }
        const inventory = await Inventory.findOrCreate(
            { warehouse: req.param('warehouse_id'), items: req.param('item_id') },
            { warehouse: req.param('warehouse_id'), items: req.param('item_id'), quantity: req.param('quantity') }
        );
        const process = async () => {

            const newStockOut = await StockOut.create({
                'sale_price': req.param('sale_price'),
                'sale_date': moment(req.param('sale_date')).toDate(),
                'quantity': req.param('quantity'),
                'items': req.param('item_id'),
                'warehouse': req.param('warehouse_id'),
                'area': req.param('area'),
                'invoice_no': req.param('invoice_no'),
                'total': req.param('quantity') * req.param('sale_price'),
                'description': req.param('description'),
                'customers': customer,
                'dealer': dealer,
                'supplier': supplier,
                'status_id': Status.ACTIVE,
            }).fetch();
            if (newStockOut) {
                let updateInventory = {};
                if (inventory) {
                    updateInventory = await Inventory.update(inventory)
                        .set({ quantity: inventory.quantity - req.param('quantity') }).fetch();
                }
                if (updateInventory) {
                    return newStockOut;
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
                sort: 'sale_price',
                query: ''
            });

        var sortable = ['sale_price'];

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
            'sale_price': {
                'like': '%' + params.query + '%'
            }
        }];




        const getStockOut = async () => {

            const StockOut_count = await StockOut.count({ where: { status_id: { '!=': Status.DELETED } } });
            if (!StockOut_count) {
                return new CustomError('stockOut not found', {
                    status: 403
                });
            }
            let stockOut = await StockOut.find(queryObject).populate('customers')
                .populate('dealer').populate('supplier').populate('items')
                .populate('warehouse');
            if (!stockOut) {
                return new CustomError('stockOut not found', {
                    status: 403
                });
            }
            for (let key in stockOut) {
                // if (stockOut[key].supplier != null)
                //     stockOut[key].supplier = stockOut[key].supplier.first_name;
                if (stockOut[key].items != null)
                    stockOut[key].items = stockOut[key].items.name;
                if (stockOut[key].warehouse != null)
                    stockOut[key].warehouse = stockOut[key].warehouse.name;
            }
            
            const responseObject = {
                stockOut: stockOut,
                totalCount: StockOut_count,
                perPage: params.per_page,
                currentPage: params.page
            };
            return responseObject;
        }

        getStockOut()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));
    },
    findOne: function (req, res) {

        if (!(req.param('id')) || isNaN(req.param('id')))
            return res.badRequest('Not a valid request');
        let StockOutId = req.param('id')
        let queryObject = {
            where: { id: StockOutId, status_id: { '!=': Status.DELETED } }
        };
        const getStockOut = async () => {
            let stockOut = await StockOut.findOne(queryObject).populate('customers')
            .populate('dealer').populate('supplier').populate('items')
            .populate('warehouse');
            if (stockOut){
                if (stockOut[key].items != null)
                    stockOut[key].items = stockOut[key].items.name;
                if (stockOut[key].warehouse != null)
                    stockOut[key].warehouse = stockOut[key].warehouse.name;
                return stockOut;
            }
            else
                return new CustomError('StockOut not found', {
                    status: 403
                });

            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });
        }

        getStockOut()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    update: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }
        let StockOutId = req.param('id');

        const updateStockOut = async () => {

            const oldStockOut = await StockOut.count({
                id: StockOutId
            });

            if (oldStockOut < 1) {
                return new CustomError('Invalid StockOut  Id', {
                    status: 403
                });
            }

            let stockOut = {};

            if (req.param('sale_price') != undefined && _.isNumber(req.param('sale_price'))) {
                stockOut.sale_price = req.param('sale_price');
            }
            if (req.param('sale_date') != undefined && _.isDate(req.param('sale_date'))) {
                stockOut.sale_date = moment(req.param('sale_date')).toDate();
            }
            if (req.param('item_id') != undefined && _.isNumber(req.param('item_id'))) {
                stockOut.items = req.param('item_id');
            }
            if (req.param('warehouse_id') != undefined && _.isNumber(req.param('warehouse_id'))) {
                stockOut.warehouse = req.param('warehouse_id');
            }
            if (req.param('quantity') != undefined && _.isNumber(req.param('quantity'))) {
                stockOut.quantity = req.param('quantity');
            }
            if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
                stockOut.status_id = req.param('status_id');
            }


            const updatedStockOut = await StockOut.update({
                id: StockOutId
            }, stockOut).fetch();

            if (updatedStockOut)
                return updatedStockOut;
            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        updateStockOut()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));

    },
    delete: function (req, res) {
        if (!req.param('id') || isNaN(req.param('id'))) {
            return res.badRequest("Id is required");
        }

        let StockOutId = req.param('id');
        let queryObject = {
            where: { id: StockOutId, status_id: { '!=': Status.DELETED } }
        };
        const deleteStockOut = async () => {

            const checkStockOut = await StockOut.count(queryObject);

            if (checkStockOut < 1) {
                return new CustomError('Invalid Document Id', {
                    status: 403
                });
            }


            const deletedStockOut = await StockOut.update({
                id: StockOutId
            }, {
                    status_id: Status.DELETED
                }).fetch();

            if (deletedStockOut)
                return deletedStockOut;
            return new CustomError('Some error occurred. Please contact development team for help.', {
                status: 403
            });


        }
        deleteStockOut()
            .then(res.ok)
            .catch(err => util.errorResponse(err, res));



    }
};


