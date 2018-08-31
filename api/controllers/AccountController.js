/**
 * AccountController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

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
      let account = await Account.find(queryObject).populate('parent').populate('children');
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
              }).populate('parent');
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



  }
};