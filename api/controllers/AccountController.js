/**
 * AccountController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
module.exports = {

  create: function (req, res) {

    if (!req.param('name') || !_.isString(req.param('name'))) {
      return res.badRequest("name required");
    }

    if (!req.param('root_type') || !_.isNumber(req.param('root_type'))) {
      return res.badRequest("root_type required");
    }
    if (!req.param('parent_id') || !_.isNumber(req.param('parent_id'))) {
      return res.badRequest("parent_id required");
    }

    const process = async () => {

      const newAcount = await Account.create({
        'name': req.param('name'),
        'root_type': req.param('root_type'),
        'account_type': req.param('account_type'),
        'account_number': req.param('account_number'),
        'is_group': req.param('is_group'),
        'status_id': Status.ACTIVE,
        'createdBy': req.token.user.id, // current logged in user id
      }).fetch();

      if (newAcount) {
        await Account.addToCollection(newAcount.id, 'parent', req.param('parent_id'));
        return newAcount;
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
        sort: 'name',
        query: ''
      });

    var sortable = ['name'];

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
      where: { status_id: { '!=': Status.DELETED }, is_group: 0 },
      // limit: parseInt(params.per_page),
      sort: '',
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'name': {
        'like': '%' + params.query + '%'
      }
    }];




    const getAccount = async () => {

      const Acount_count = await Account.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (Acount_count < 1) {
        throw new CustomError('account not found', {
          status: 403
        });
      }
      let account = await Account.find(queryObject).populate('children').populate('parent');
      if (account.length < 1) {
        throw new CustomError('account not found', {
          status: 403
        });
      }
      const dealerAccount = await Account.findOne({ id: 99 }).populate('children').populate('parent');
      const customerAccount = await Account.findOne({ id: 129 }).populate('children').populate('parent');
      account.push(dealerAccount);
      account.push(customerAccount);
      const responseObject = {
        account: account,
        totalCount: Acount_count,
        // perPage: params.per_page,
        // currentPage: params.page
      };
      return responseObject;
    }

    getAccount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  chartOfAccount: function (req, res) {
    var params = req.allParams(),
      params = _.defaults(params, {
        filters: [],
        page: 1,
        per_page: 20,
        sort_dir: 'ASC',
        sort: 'name',
        query: ''
      });

    var sortable = ['name'];

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

    let queryObject = { // is_group:0 id: 77,
      where: { status_id: { '!=': Status.DELETED }, },
      // limit: parseInt(params.per_page),
      sort: '',
      select: ['id', 'name', 'root_type'],
    };
    if (params.sort && _.indexOf(sortable, params.sort) > -1) {
      queryObject.sort = params.sort + ' ' + params.sort_dir;
    }
    queryObject.where.or = [{
      'name': {
        'like': '%' + params.query + '%'
      }
    }];



    // function checkNode(node) {
    //   if (node.value === value) {
    //     return true;
    //   }
    //   if (node.children.length > 0) {
    //     for (let i = 0; i < node.children.length; i++) {
    //       if (checkNode(node.children[i])) return true;
    //     }
    //   }
    //   return false;
    // }



    // let balance_sum = async function (child) {

    //   if (child.length == 1) {
    //     console.log( ' if ', child);
    //     let balance = await sails.helpers.getAccountBalance(child[0].id);
    //     return balance;
    //   }
    //   else {
    //     let sum = 0;
    //     for(let c of child){
    //       sum += await sails.helpers.getAccountBalance(c.id)
    //     }
    //     return sum;
    //     // console.log( ' else ', child);
    //     // let next_child;
    //     // if (child[0].id) {
    //     //   next_child = await Account.find(
    //     //     {
    //     //       where: { id: child[0].id, status_id: { '!=': Status.DELETED } },
    //     //       // select: ['balance'],
    //     //     }).populate('children');
    //     // }
    //     // let balance = await sails.helpers.getAcountBalance(child[0].id);
    //     // if (next_child && next_child.length >= 1) {
    //     //   return balance + balance_sum(next_child[0].children);
    //     // }
    //   }

    // }


    const getAcount = async () => {

      const Acount_count = await Account.count({ where: { status_id: { '!=': Status.DELETED } } });
      if (Acount_count < 1) {
        throw new CustomError('account not found', {
          status: 403
        });
      }
      let account = await Account.find(queryObject).populate('parent', { select: ['name'] });
      if (account.length < 1) {
        throw new CustomError('account not found', {
          status: 403
        });
      }
      let dataArray = [];
      for (let key in account) {
        // console.log(key);
        let data = {
          hierarchy: [],
        };
        // const ale = await AccountLedgerEntry.find({
        //   where: { account: account[key].id },
        //   sort: 'updatedAt DESC',
        //   limit: 1
        // });

        // data.balance = ale[0] != null ?  ale[0].balance : 0;
        data.hierarchy.push(account[key].name);
        for (let p of account[key].parent) {
          let parent = p;
          data.hierarchy.push(parent.name);
          // data.balance = await sails.helpers.getAcountBalance(account[key]);
          while (parent) {
            const next_parent = await Account.find(
              {
                where: { id: parent.id, status_id: { '!=': Status.DELETED } },
                select: ['name'],
              }).populate('parent', { select: ['name'] });
            parent = next_parent[0].parent[0];
            if (next_parent[0].parent.length > 0) {
              data.hierarchy.push(parent.name);
            }
            else {
              // console.log(next_parent[0].parent);
              break;
            }
          }

          // console.log(p.name);
        }

        data.hierarchy = data.hierarchy.reverse();
        data.name = account[key].name;
        data.root_type = account[key].root_type;
        data.id = key;
        data.account_id = account[key].id;
        // let balance = await sails.helpers.getAccountBalance(account[key].id);
        // let children = account[key].children
        // while(children){
        //   console.log(children);
        //   const next_child = await Account.find(
        //     {
        //       where: { id: children.id, status_id: { '!=': Status.DELETED } },
        //       // select: ['balance'],
        //     }).populate('children');
        //     children = next_child[0].children
        //     break;
        // }
        // for (let c of account[key].children) {
        //   let children = c;
        //   // data.hierarchy.push(parent.name);
        //   // data.balance = await sails.helpers.getAcountBalance(account[key]);
        //   balance = balance + await sails.helpers.getAccountBalance(children.id);
        //   // console.log('first length ' ,children);
        //   while (children) {
        //     const next_child = await Account.find(
        //       {
        //         where: { id: children.id, status_id: { '!=': Status.DELETED } },

        //       }).populate('children');
        //     // for (let i = 0; i<next_child[0].children.length; i++){

        //     // }
        //     let i=0;
        //     // while(next_child[0].children.length !== i){
        //     //   balance = balance + await sails.helpers.getAccountBalance(next_child[0].children[i].id);
        //     //   i++;
        //     // }
        //     children = next_child[0].children[0];
        //     console.log('Length', next_child[0].children.length);
        //     if (next_child[0].children.length > 0) {
        //       // data.hierarchy.push(children.name);
        //       balance = balance + await sails.helpers.getAccountBalance(children.id);
        //     }
        //     else {
        //       // console.log(next_parent[0].parent);
        //       break;
        //     }
        //   }

        //   // console.log(p.name);
        // }
        // console.log(account[key].children);
        // console.log(await util.balance_sum(account[key].children));
        // await util.balance_sum(account[key].children) + 
        // if(account[key].children.length == 0){
        data.balance = await sails.helpers.getAccountBalance(account[key].id);

        // }
        // else
        //   data.balance = await util.balance_sum(account[key].children , await sails.helpers.getAccountBalance(account[key].id));

        dataArray.push(data);
      }

      // dataArray.reduce(function x(r, a) {
      //   a.balance = a.balance || Array.isArray(a.children) && a.children.reduce(x, 0) || 0;
      //   return r + a.balance;
      // }, 0);


      // const responseObject = {
      //   account: account,
      //   totalCount: Acount_count,
      //   perPage: params.per_page,
      //   currentPage: params.page
      // };
      // console.log('data ' , dataArray.length);
      return dataArray;
    }

    getAcount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  },
  findOne: function (req, res) {

    if (!(req.param('id')) || isNaN(req.param('id')))
      return res.badRequest('Not a valid request');
    let AcountId = req.param('id')
    let queryObject = {
      where: { id: AcountId, status_id: { '!=': Status.DELETED } }
    };
    const getAcount = async () => {
      let account = await Account.findOne(queryObject).populate('children').populate('parent');

      if (account)
        return account;
      else
        throw new CustomError('Account not found', {
          status: 403
        });

      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });
    }

    getAcount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  update: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }
    let AcountId = req.param('id');

    const updateAcount = async () => {

      const oldAcount = await Account.count({
        id: AcountId
      });

      if (oldAcount < 1) {
        throw new CustomError('Invalid Account  Id', {
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
      if (req.param('account_number') != undefined && _.isNumber(req.param('account_number'))) {
        account.account_number = req.param('account_number');
      }
      if (req.param('is_group') != undefined && _.isBoolean(req.param('is_group'))) {
        account.is_group = req.param('is_group');
      }
      if (req.param('status_id') != undefined && _.isNumber(req.param('status_id'))) {
        account.status_id = req.param('status_id');
      }


      const updatedAcount = await Account.update({
        id: AcountId
      }, account).fetch();

      if (updatedAcount)
        return updatedAcount;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    updateAcount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));

  },
  delete: function (req, res) {
    if (!req.param('id') || isNaN(req.param('id'))) {
      return res.badRequest("Id is required");
    }

    let AcountId = req.param('id');
    let queryObject = {
      where: { id: AcountId, status_id: { '!=': Status.DELETED } }
    };
    const deleteAcount = async () => {

      const checkAcount = await Account.count(queryObject);

      if (checkAcount < 1) {
        throw new CustomError('Invalid Document Id', {
          status: 403
        });
      }


      const deletedAcount = await Account.update({
        id: AcountId
      }, {
          status_id: Status.DELETED
        }).fetch();

      if (deletedAcount)
        return deletedAcount;
      throw new CustomError('Some error occurred. Please contact development team for help.', {
        status: 403
      });


    }
    deleteAcount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));



  },
  payment: async function (req, res) {
    const infixToPrefix = require('infix-to-prefix');
    var Calculator = require('polish-notation'),
      calculator = new Calculator();
    if (!req.param('amount') || isNaN(req.param('amount'))) {
      return res.badRequest("amount is required");
    }
    if (!req.param('partyOfId') || isNaN(req.param('partyOfId'))) {
      return res.badRequest("Id of party is required");
    }
    if (!req.param('partyOf') || !_.isString(req.param('partyOf'))) {
      return res.badRequest("party is required");
    }
    // amount: 343
    // partyOf: "Dealer"
    // partyOfId: 11
    let wf_number;
    let dealers;
    let customers;
    switch (req.param('partyOf')) {
      case 'Dealer': {
        wf_number = 5;
        dealers = await User.findOne({ id: req.param('partyOfId') });
        break;
      }
      case 'Customer': {
        wf_number = 6;
        customers = await Customers.findOne({ id: req.param('partyOfId') });
        break;
      }
      case 'Employee': {
        wf_number = 7;
        break;
      }
      default:
        break;
    }
    const paymentAccount = async () => {

      let workflowArray = [];
      const workflow = await Workflow.find({
        where: { wf_number: wf_number, status_id: { '!=': Status.DELETED } }
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
            'user_remarks': 'account payment recieved of ' + req.param('partyOf') + ' with id : ' + req.param('partyOfId'),
            'status_id': Status.ACTIVE,
          }).fetch();
        // await JournalEntry.findOne({
        //   name:newConnection.customers.username
        // });
        if (!newJournalEntry) {
          throw new CustomError('JournalEntry record insertion error', {
            status: 403
          });
        }
        for (let w of workflow) {
          data = {};
          data.journalentry = newJournalEntry.id;
          if (w.account.id == 99) {
            const connAccount = await Account.find({ where: { name: customers.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 129) {
            const connAccount = await Account.find({ where: { name: dealers.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 128) {
            const connAccount = await Account.find({ where: { name: req.token.user.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else
            data.account = w.account.id
          let formulaString = w.credit == '0' ? infixToPrefix(w.debit) : infixToPrefix(w.credit);
    
          let variableArr = formulaString.split(' ');
          for (let v of variableArr) {
            switch (v) {
              case 'amount':
                formulaString = formulaString.replace('amount', req.param('amount'));
                break;
              case 'company_retail_price':
                formulaString = formulaString.replace('company_retail_price', 0);
                break;
              case 'company_cost_price':
                formulaString = formulaString.replace('company_cost_price', 0);
                break;
              case 'dealer_cost_price':
                formulaString = formulaString.replace('dealer_cost_price', 0);
                break;
              case 'dealer_retail_price':
                formulaString = formulaString.replace('dealer_retail_price', 0);
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
            'description' :'Payment made for account',
            'balance': balance,
            'createdBy': req.token.user.id, // current logged in user id
          }).fetch();
          if (!newALE) {
            await JournalEntryAccount.destroy({ id: newJournalEntryAccount.id });
            throw new CustomError('Account Ledger insertion error.', {
              status: 403
            });
          }
          // console.log('data inserted in ledger ', newALE);
        }
      }
      return 'Payment made successfully'
    }
    paymentAccount()
      .then(res.ok)
      .catch(err => util.errorResponse(err, res));
  }
};