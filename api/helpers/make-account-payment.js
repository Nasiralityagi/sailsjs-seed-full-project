module.exports = {


  friendlyName: 'Make account payment',


  description: '',


  inputs: {
    account: {
      type: 'string',
      description: 'Account name',
      required: true
    },
    credit: {
      type: 'number',
      example: 1,
      description: 'Credit amount',
      required: true
    },
    debit: {
      type: 'number',
      example: 1,
      description: 'Debit amount',
      required: true
    },
    againt_account: {
      type: 'string',
      description: 'Against account',
      required: true
    },
    remarks: {
      type: 'string',
      description: 'Remarks',
    },
    createdBy: {
      type: 'number',
      example: 1,
      description: 'current logged user',
      required: true
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
   
    const newJournalEntry = await JournalEntry.create(
      {
        'date': moment().toDate(),
        'entry_type': 1,
        'reference_number': 0,
        'reference_date': moment().toDate(),
        'user_remarks': inputs.remarks,
        'status_id': Status.ACTIVE,
      }).fetch();
    if (!newJournalEntry) {
      throw 'error'
    }
    else {
      const account = await Account.find({name:inputs.account}).limit(1);
      const newJournalEntryAccount = await JournalEntryAccount.create({
        'debit': inputs.debit,
        'credit': inputs.credit,
        'account': account[0].id,
        'journalentry': newJournalEntry.id,
        'status_id': Status.ACTIVE,
        'createdBy': inputs.createdBy, // current logged in user id
      }).fetch();
      if (!newJournalEntryAccount) {
        await JournalEntry.destroy({ id: newJournalEntry.id });
        throw 'error'
      }
      else {
        const ale = await AccountLedgerEntry.find({
          where: { account: newJournalEntryAccount.account },
          sort: 'updatedAt DESC',
          limit: 1
        });
        let balance = 0;
        if (ale.length == 0) {
          balance = newJournalEntryAccount.debit - newJournalEntryAccount.credit
        }
        else {
          balance = ale[0].balance + (newJournalEntryAccount.debit - newJournalEntryAccount.credit)
        }
        const newALE = await AccountLedgerEntry.create({
          'date': newJournalEntry.date,
          'account': newJournalEntryAccount.account,
          'debit': newJournalEntryAccount.debit,
          'credit': newJournalEntryAccount.credit,
          'against_account': inputs.against_account == null ? '' : inputs.against_account,
          'reference_type': '',
          'balance': balance,
          'description' : newJournalEntry.user_remarks,
          'createdBy': inputs.createdBy, // current logged in user id
        }).fetch();
        if (!newALE) {
          await JournalEntryAccount.destroy({ id: newJournalEntryAccount.id });
          await JournalEntry.destroy({ id: newJournalEntry.id });
          throw 'error'
        }
        else
          return exits.success();
      }
    }

    if (!inputs) {
      throw 'error'
    }


  }


};

