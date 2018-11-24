module.exports = {


  friendlyName: 'Make invoice payment',


  description: '',


  inputs: {
    invoice_id: {
      type: 'number',
      example: 1,
      description: 'invoice_id',
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
      where: { id: inputs.invoice_id, status_id: { '!=': Status.DELETED } }
    };
    // console.log(updatedConnRenewal);
    const invoice = await Invoices.findOne(queryObject).populate('customers').populate('packages');

    if (!invoice) {

      throw 'error'
    }
    else {
      // await Customers.update({ id: invoice.id }).set({ status_id: Status.ACTIVE });
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
            'user_remarks': 'Journal Entry created for Customer : ' + invoice.customers.first_name + ' and Dealer id: ' + invoice.customers.createdBy,
            'status_id': Status.ACTIVE,
          }).fetch();
        // await JournalEntry.findOne({
        //   name:invoice.username
        // });
        if (!newJournalEntry) {

          throw 'error'
        }
        for (let w of workflow) {
          data = {};
          data.journalentry = newJournalEntry.id;
          if (w.account.id == 99) {
            const connAccount = await Account.find({ where: { name: invoice.customers.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 129) {
            const dealer = await User.findOne({ id: invoice.customers.createdBy });
            const connAccount = await Account.find({ where: { name: dealer.username } }).limit(1);
            data.account = connAccount.length == 0 || connAccount == undefined ? w.account.id : connAccount[0].id;
          }
          else if (w.account.id == 128) {
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

          let dealerPackages = await DealerPackages.find({
            where: {
              dealer: invoice.customers.createdBy,
              packages: invoice.packages != null ? invoice.packages.id : null, status_id: { '!=': Status.DELETED },
            }
          }).limit(1);
          let formulaString = w.credit == '0' ? infixToPrefix(w.debit) : infixToPrefix(w.credit);
          let variableArr = formulaString.split(' ');
          for (let v of variableArr) {
            switch (v) {
              case 'amount':
                formulaString = formulaString.replace('amount', inputs.amount);
                break;
              case 'company_cost_price':
                formulaString = formulaString.replace('company_cost_price', invoice.packages != null ? invoice.packages.cost_price : 0);
                break;
              case 'company_retail_price':
                formulaString = formulaString.replace('company_retail_price', invoice.packages != null ? invoice.packages.retail_price : 0);
                break;
              case 'dealer_cost_price':
                formulaString = formulaString.replace('dealer_cost_price', dealerPackages.length <= 0 ? 0 : dealerPackages[0].price);
                break;
              case 'dealer_retail_price':
                formulaString = formulaString.replace('dealer_retail_price',  dealerPackages.length <= 0 ? 0 : dealerPackages[0].retail_price);
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

