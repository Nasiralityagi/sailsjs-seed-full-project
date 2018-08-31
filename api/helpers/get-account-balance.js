module.exports = {


  friendlyName: 'Get account balance',


  description: '',


  inputs: {
    id: {
      type: 'number',
      example: 1,
      description: 'Account id',
      required: true
    }
  },


  exits: {

    success: {
      outputFriendlyName: 'Account balance',
      outputType: 'ref'
    },

  },


  fn: async function (inputs , exits) {

    // Get account balance.
    var accountBalance = await AccountLedgerEntry.find({
      where: { account: inputs.id },
      sort: 'updatedAt DESC',
      limit: 1
    });
    // TODO
    
    // Send back the result through the success exit.
    if (accountBalance.length === 0) {
      return exits.success(0);
    }
    return exits.success(accountBalance[0].balance);
  

  }


};

