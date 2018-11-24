module.exports = {


  friendlyName: 'Make wf payment',


  description: '',


  inputs: {
    wf_array: {
      type: 'ref',
      description: 'Array',
      required: true
    },
    jeDate: {
      type: 'string',
      description: 'inputs.jeDate',
      required: true
    },
    jeId: {
      type: 'number',
      example: 1,
      description: 'inputs.jeId',
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
      outputFriendlyName: 'Account balance',
      outputType: 'ref'
    },
    error: {
      description: 'error occured while making payment.'
    }
  },


  fn: async function (inputs, exits) {
    var moment = require('moment');
    for (let key in inputs.wf_array) {
      // console.log(inputs.wf_array[key] , inputs.jeId);
      const newJournalEntryAccount = await JournalEntryAccount.create({
        'debit': inputs.wf_array[key].debit,
        'credit': inputs.wf_array[key].credit,
        'account': inputs.wf_array[key].account,
        'journalentry': inputs.jeId,
        'status_id': Status.ACTIVE,
        'createdBy': inputs.createdBy, // current logged in user id
      }).fetch();

      const ale = await AccountLedgerEntry.find({
        where: { account: inputs.wf_array[key].account },
        sort: 'updatedAt DESC',
        limit: 1
      });
      let against_account = null;

      for (let j of inputs.wf_array) {
        // console.log(j);
        if (inputs.wf_array[key].debit <= 0 && j.account != inputs.wf_array[key].account) {
          if (j.debit > 0) {
            const account = await Account.findOne({ id: j.account });
            if (account) {
              against_account = against_account == null ?
                account.name : against_account + ' , ' + account.name;
            }
            // console.log(against_account)
          }
        }
        else if (inputs.wf_array[key].credit <= 0 && j.account != inputs.wf_array[key].account) {
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
        balance = inputs.wf_array[key].debit - inputs.wf_array[key].credit
      }
      else {
        balance = ale[0].balance + (inputs.wf_array[key].debit - inputs.wf_array[key].credit)
      }
      const newALE = await AccountLedgerEntry.create({
        'date': moment(inputs.jeDate).toDate(),
        'account': inputs.wf_array[key].account,
        'debit': inputs.wf_array[key].debit,
        'credit': inputs.wf_array[key].credit,
        'against_account': against_account == null ? '' : against_account,
        'reference_type': '',
        'balance': balance,
        'description' : 'payment made for workflow',
        'createdBy': inputs.createdBy, // current logged in user id
      }).fetch();
      if (!newALE) {
        await JournalEntryAccount.destroy({ id: newJournalEntryAccount.id });
        throw 'error'
      }
      // console.log('data inserted in ledger ', newALE);
    }
    // All done.
    return exits.success();

  }


};

