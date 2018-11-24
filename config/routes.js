/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {


  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': {
    view: 'homepage'
  },

  
 /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

 // for UserController

  'POST /user/create': 'UserController.create',                           
  'GET /user/findOne/:id': 'UserController.findOne',
  'GET /user/find': 'UserController.find',
  'POST /user/update': 'UserController.update',
  'DELETE /user/delete': 'UserController.delete',
  'POST /user/login': 'UserController.login',
  'GET /user/logout': 'UserController.logout',

  // for CustomersController

  'POST /customer/create': 'CustomersController.create',
  'GET /customer/find': 'CustomersController.find',
  'GET /customer/customerConnection': 'CustomersController.customerConnection',
  'GET /customer/findOne/:id': 'CustomersController.findOne',
  'POST /customer/update': 'CustomersController.update',
  'DELETE /customer/delete': 'CustomersController.delete',
  'POST /customer/login': 'CustomersController.login',
  'POST /customer/customerTimeline': 'CustomersController.customerTimeline',
  'POST /customer/fileUpload': 'CustomersController.fileUpload',
  'POST /customer/getToken': 'CustomersController.getToken',
  'POST /customer/verifyToken': 'CustomersController.verifyToken',
  'GET /customer/customerDoc': 'CustomersController.customerDoc',
  'GET /customer/customerReport': 'CustomersController.customerReport',
  'GET /customer/customerUsernameList': 'CustomersController.customerUsernameList',
  // for DocumentsController

   'POST /documents/create': 'DocumentsController.create',
   'GET /documents/find': 'DocumentsController.find',
   'GET /documents/findOne/:id': 'DocumentsController.findOne',
   'POST /documents/update': 'DocumentsController.update',
   'DELETE /documents/delete': 'DocumentsController.delete',

// for  BasestationController

  'POST /basestation/create': 'BasestationController.create',
  'GET /basestation/find': 'BasestationController.find',
  'GET /basestation/findOne/:id': 'BasestationController.findOne',
  'POST /basestation/update': 'BasestationController.update',
  'DELETE /basestation/delete': 'BasestationController.delete',

// for  ConnectionController

'POST /connection/create': 'ConnectionController.create',
'GET /connection/find': 'ConnectionController.find',
'GET /connection/findOne/:id': 'ConnectionController.findOne',
'POST /connection/update': 'ConnectionController.update',
'DELETE /connection/delete': 'ConnectionController.delete',
'POST /connection/connectionTimeline': 'ConnectionController.connectionTimeline',
'GET /connection/pendingConnection': 'ConnectionController.pendingConnection',
'POST /connection/activeConnection': 'ConnectionController.activeConnection',
'POST /connection/liveConnection': 'ConnectionController.liveConnection',
'POST /connection/fileUpload': 'ConnectionController.fileUpload',
'GET /connection/docFind': 'ConnectionController.docFind',
'POST /connection/rejectDoc': 'ConnectionController.rejectDoc',
'POST /connection/increaseTimer': 'ConnectionController.increaseTimer',
'GET /connection/connectionList': 'ConnectionController.connectionList',
'GET /connection/packageChangeList': 'ConnectionController.packageChangeList',
'GET /connection/connectionToChange': 'ConnectionController.connectionToChange',
'POST /connection/changePassword': 'ConnectionController.changePassword',
'POST /connection/clearMac': 'ConnectionController.clearMac',
'POST /connection/changePackage': 'ConnectionController.changePackage',

// for  PackagesController

'POST /package/create': 'PackagesController.create',
'GET /package/find': 'PackagesController.find',
'GET /package/findOne/:id': 'PackagesController.findOne',
'POST /package/update': 'PackagesController.update',
'DELETE /package/delete': 'PackagesController.delete',

// for  ConnRenewalController

'POST /connrenewal/create': 'ConnRenewalController.create',
'GET /connrenewal/find': 'ConnRenewalController.find',
'GET /connrenewal/finddata': 'ConnRenewalController.findData',
'GET /connrenewal/findOne/:id': 'ConnRenewalController.findOne',
'POST /connrenewal/update': 'ConnRenewalController.update',
'DELETE /connrenewal/delete': 'ConnRenewalController.delete',
'POST /connrenewal/rechargeConnection': 'ConnRenewalController.rechargeConnection',
'GET /connrenewal/paidConnection': 'ConnRenewalController.paidConnection',
'GET /connrenewal/expiredConnection': 'ConnRenewalController.expiredConnection',
'POST /connrenewal/changePackage': 'ConnRenewalController.changePackage',
'GET /connrenewal/connectionToRenew': 'ConnRenewalController.connectionToRenew',

// for  UsersRoutesController

'POST /usersroutes/create': 'UsersRoutesController.create',
'GET /usersroutes/find': 'UsersRoutesController.find',
'GET /usersroutes/findOne/:id': 'UsersRoutesController.findOne',
'POST /usersroutes/update': 'UsersRoutesController.update',
'DELETE /usersroutes/delete': 'UsersRoutesController.delete',

// for  RoutesController

'POST /routes/create': 'RoutesController.create',
'GET /routes/find': 'RoutesController.find',
'GET /routes/findOne/:id': 'RoutesController.findOne',
'POST /routes/update': 'RoutesController.update',
'DELETE /routes/delete': 'RoutesController.delete',

// for  RolesRoutesController

'POST /rolesroutes/create': 'RolesRoutesController.create',
'GET /rolesroutes/find': 'RolesRoutesController.find',
'GET /rolesroutes/findOne/:id': 'RolesRoutesController.findOne',
'POST /rolesroutes/update': 'RolesRoutesController.update',
'DELETE /rolesroutes/delete': 'RolesRoutesController.delete',

// for  RolesController

'POST /roles/create': 'RolesController.create',
'GET /roles/find': 'RolesController.find',
'GET /roles/findOne/:id': 'RolesController.findOne',
'POST /roles/update': 'RolesController.update',
'DELETE /roles/delete': 'RolesController.delete',

// for  NotifyController

'POST /notify/create': 'NotifyController.create',
'POST /notify/stop': 'NotifyController.stopCron',
'GET /notify/findOne/:id': 'NotifyController.findOne',
'GET /notify/find': 'NotifyController.find',
'POST /notify/update': 'NotifyController.update',
'DELETE /notify/delete': 'NotifyController.delete',

// for  DealerPackagesController

'POST /dealerpackages/create': 'DealerPackagesController.create',
'GET /dealerpackages/find/:dealer_id': 'DealerPackagesController.find',
'GET /dealerpackages/findOne/:id': 'DealerPackagesController.findOne',
'POST /dealerpackages/update': 'DealerPackagesController.update',
'DELETE /dealerpackages/delete': 'DealerPackagesController.delete',

// for  DealerMapController

'POST /dealermap/create': 'DealerMapController.create',
'GET /dealermap/find': 'DealerMapController.find',
'GET /dealermap/findOne/:id': 'DealerMapController.findOne',
'POST /dealermap/update': 'DealerMapController.update',
'DELETE /dealermap/delete': 'DealerMapController.delete',
'DELETE /dealermap/deleteall': 'DealerMapController.deleteAll',
// for  ComplaintsController

'POST /complaints/create': 'ComplaintsController.create',
'GET /complaints/find': 'ComplaintsController.find',
'GET /complaints/findOne/:id': 'ComplaintsController.findOne',
'POST /complaints/update': 'ComplaintsController.update',
'DELETE /complaints/delete': 'ComplaintsController.delete',

// for  DashboardController

'POST /dashboard/customerexpire': 'DashboardController.customerExpire',
'POST /dashboard/customerexp': 'DashboardController.customerExpirePercentage',
'GET /dashboard/totalCustomer': 'DashboardController.totalCustomer',
'GET /dashboard/customerByDealer': 'DashboardController.customerByDealer',
'POST /dashboard/monthTimeline': 'DashboardController.monthTimeline',


// for  WarehouseController

'POST /warehouse/create': 'WarehouseController.create',
'GET /warehouse/find': 'WarehouseController.find',
'GET /warehouse/findOne/:id': 'WarehouseController.findOne',
'POST /warehouse/update': 'WarehouseController.update',
'DELETE /warehouse/delete': 'WarehouseController.delete',

// for  StockInController

'POST /stockin/create': 'StockInController.create',
'GET /stockin/find': 'StockInController.find',
'GET /stockin/findOne/:id': 'StockInController.findOne',
'POST /stockin/update': 'StockInController.update',
'DELETE /stockin/delete': 'StockInController.delete',

// for  StockOutController

'POST /stockout/create': 'StockOutController.create',
'GET /stockout/find': 'StockOutController.find',
'GET /stockout/findOne/:id': 'StockOutController.findOne',
'POST /stockout/update': 'StockOutController.update',
'DELETE /stockout/delete': 'StockOutController.delete',

// for  ItemsController

'POST /items/create': 'ItemsController.create',
'GET /items/find': 'ItemsController.find',
'GET /items/findOne/:id': 'ItemsController.findOne',
'POST /items/update': 'ItemsController.update',
'DELETE /items/delete': 'ItemsController.delete',

// for  SupplierController

'POST /supplier/create': 'SupplierController.create',
'GET /supplier/find': 'SupplierController.find',
'GET /supplier/findOne/:id': 'SupplierController.findOne',
'POST /supplier/update': 'SupplierController.update',
'DELETE /supplier/delete': 'SupplierController.delete',

// for  AccountController

'POST /account/create': 'AccountController.create',
'GET /account/find': 'AccountController.find',
'GET /account/findOne/:id': 'AccountController.findOne',
'POST /account/update': 'AccountController.update',
'DELETE /account/delete': 'AccountController.delete',
'GET /account/chartOfAccount': 'AccountController.chartOfAccount',
'POST /account/payment': 'AccountController.payment',
'GET /account/loggedUserBalance': 'AccountLedgerEntryController.loggedUserBalance',

// for  JournalEntryController

'POST /journalentry/create': 'JournalEntryController.create',
'GET /journalentry/find': 'JournalEntryController.find',
'GET /journalentry/findOne/:id': 'JournalEntryController.findOne',
'POST /journalentry/update': 'JournalEntryController.update',
'DELETE /journalentry/delete': 'JournalEntryController.delete',


// AccountLedgerEntryController

'GET /ledger/find': 'AccountLedgerEntryController.find',
'GET /ledger/findOne/:id': 'AccountLedgerEntryController.findOne',

// for  WorkflowController

'POST /workflow/create': 'WorkflowController.create',
'GET /workflow/find': 'WorkflowController.find',
'GET /workflow/findOne/:id': 'WorkflowController.findOne',
'POST /workflow/update': 'WorkflowController.update',
'DELETE /workflow/delete': 'WorkflowController.delete',
'POST /workflow/createMultiple': 'WorkflowController.createMultiple',


// for  RolePermissionsController

'POST /rolepermissions/create': 'RolePermissionsController.create',
'GET /rolepermissions/find': 'RolePermissionsController.find',
'GET /rolepermissions/findOne/:id': 'RolePermissionsController.findOne',
'POST /rolepermissions/update': 'RolePermissionsController.update',
'DELETE /rolepermissions/delete': 'RolePermissionsController.delete',

 
// for InvoicesController

'POST /invoices/create': 'InvoicesController.create',
'GET /invoices/find': 'InvoicesController.find',
'GET /invoices/findOne/:id': 'InvoicesController.findOne',
'POST /invoices/update': 'InvoicesController.update',
'DELETE /invoices/delete': 'InvoicesController.delete',
'POST /invoices/payment': 'InvoicesController.payment',
'GET /invoices/customerForInvoice': 'InvoicesController.customerForInvoice',
'POST /invoices/ispackage': 'InvoicesController.isPackage',
'POST /invoices/print': 'InvoicesController.print',

// for LoginManagerController

'POST /loginmanager/verifyChangePassword': 'LoginManagerController.verifyChangePassword',
'GET /loginmanager/changePasswordList': 'LoginManagerController.changePasswordList',
'GET /loginmanager/changeMacList': 'LoginManagerController.changeMacList',
'POST /loginmanager/verifyChangeMac': 'LoginManagerController.verifyChangeMac',
'GET /loginmanager/changePackageList': 'LoginManagerController.changePackageList',
'POST /loginmanager/verifyChangePackage': 'LoginManagerController.verifyChangePackage',



// for CommonController

'POST /grace_period/create': 'CommonController.create_grace_days',
'GET /grace_period/find': 'CommonController.find_grace_period',
'POST /grace_period/update': 'CommonController.update_grace_period',
'GET /common/clearDatabase': 'CommonController.clearDatabase',
'GET /hello':'CommonController.hello',
'GET /leave':'CommonController.leave'
  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝


  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝


};
