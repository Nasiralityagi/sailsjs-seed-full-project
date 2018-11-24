module.exports = {


  friendlyName: 'Get package prices',


  description: '',


  inputs: {
    package_id: {
      type: 'number',
      example: 1,
      description: 'package id',
      required: true
    },
    dealer_id: {
      type: 'number',
      example: 1,
      description: 'dealer id',
      required: true
    }
  },


  exits: {

    success: {
      outputFriendlyName: 'Package prices',
      outputType: 'ref'
    },
    error: {
      description: 'error occured while getting package.'
    }

  },


  fn: async function (inputs, exits) {

    // Get package prices.
    let packagePrices = {
      cost_price: 0,
      retail_price: 0,
    };
    // TODO
    let dealerPackages = await DealerPackages.findOne({
      where: {
        dealer: inputs.dealer_id,
        packages: inputs.package_id,
        status_id: { '!=': Status.DELETED }
      },
    });
    if (dealerPackages) {
      packagePrices.cost_price = dealerPackages.price;
      packagePrices.retail_price = dealerPackages.retail_price
      return exits.success(packagePrices);
    }
    else {
      const package = await Packages.findOne({ id: inputs.package_id, status_id: { '!=': Status.DELETED } });
      if (package) {
        packagePrices.cost_price = package.cost_price;
        packagePrices.retail_price = package.retail_price
        return exits.success(packagePrices);
      }
      else{
        throw 'error'
      }
    }

  }


};

