module.exports = {


  friendlyName: 'Make dealer customer payment',


  description: '',


  inputs: {


    customer_id: {
      type: 'number',
      example: 1,
      description: 'customer_id',
      required: true,
    },
    amount: {
      type: 'number',
      example: 1,
      description: 'price',
      required: true,
    },
    wf_number: {
      type: 'number',
      example: 1,
      description: 'work flow number',
      required: true,
    },
    createdBy: {
      type: 'number',
      example: 1,
      description: 'current logged user',
    },
  },


  exits: {
    success: {
      outputFriendlyName: 'dealer customer',
      outputType: 'ref'
    },
    error: {
      description: 'error occured while making dealer customer payment.'
    }
  },


  fn: async function (inputs, exits) {
    var moment = require('moment');
    const infixToPrefix = require('infix-to-prefix');
    var Calculator = require('polish-notation'),
      calculator = new Calculator();
    let queryObject = {
      where: { id: inputs.customer_id, status_id: { '!=': Status.DELETED } }
    };
    // console.log(updatedConnRenewal);
    const newCustomers = await Customers.findOne(queryObject).populate('createdBy');

    if (!newCustomers) {

      throw 'error'
    }
    else {
      // await Customers.update({ id: newCustomers.id }).set({ status_id: Status.ACTIVE });
      let workflowArray = [];
      const workflow = await Workflow.find({
        where: { wf_number: inputs.wf_number, status_id: { '!=': Status.DELETED } }
      }).populate('account');
      if (workflow.length < 1) {

        throw 'error'
      }
      else {
        const newJournalEntry = await JournalEntry.create(
          {
            'date': moment().toDate(),
            'entry_type': 1,
            'reference_number': 0,
            'reference_date': moment().toDate(),
            'user_remarks': 'Journal Entry created for Customer : ' + newCustomers.first_name + ' and Dealer : ' + newCustomers.createdBy.first_name,
            'status_id': Status.ACTIVE,
          }).fetch();
        // await JournalEntry.findOne({
        //   name:newCustomers.username
        // });
        if (!newJournalEntry) {

          throw 'error'
        }
        for (let w of workflow) {
          data = {};
          data.journalentry = newJournalEntry.id;
          if (w.account.id == 99) {
            const connAccount = await Account.find({ where: { name: newCustomers.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 129) {
            const connAccount = await Account.find({ where: { name: newCustomers.createdBy.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 128) {
            // const connAccount = await Account.find({ where: { name: newCustomers.createdBy.username } }).limit(1);
            // data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
            const dealer = await User.find({ id: inputs.createdBy }).limit(1);
            if (dealer.length > 0) {
                const connAccount = await Account.find({ where: { name: dealer[0].username } }).limit(1);
                data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
            }
            else
                data.account = w.account.id
          }
          else
            data.account = w.account.id
          let formulaString = w.credit == '0' ? infixToPrefix(w.debit) : infixToPrefix(w.credit);
          let variableArr = formulaString.split(' ');
          for (let v of variableArr) {
            switch (v) {
              case 'amount':
                formulaString = formulaString.replace('amount', inputs.amount);
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
        await sails.helpers.makeWfPayment(workflowArray, newJournalEntry.date, newJournalEntry.id, inputs.createdBy)
          .intercept('error', () => {

            throw 'error'
          });

      }
    }
    // return 'Recharged successfully';
    // All done.
    return exits.success();

  }



};

