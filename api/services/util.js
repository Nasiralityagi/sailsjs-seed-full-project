'use strict';
let _ = require('lodash'),
Chance = require('chance'),
    random = new Chance();


module.exports.getEncryptedPassword = function (password, cb) {

  var passwordReg = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9\.\-\_\!]+){6,15}$/g;

  if (!passwordReg.test(password)) {
    return cb(false, 'Password must contain at least one digit and be between 6 and 15 characters long.');
  } else if (password.length < 6 || password.length > 15) {
    return cb(false, 'Password must be in between 6 and 15 characters');
  }

  require('machinepack-passwords').encryptPassword({
    password: password
  }).exec({
    error: function (err) {
      req.wantsJSON = true;
      if (!password) {
        //return res.badRequest('Missing password field');
        return cb(false, 'Missing password field');
      }
      return cb(false, err);
    },
    success: cb
  });
};


/**
 *
 * @param password
 * @returns {Promise} - A promise object
 */
module.exports.getEncryptedPasswordAsync = function (password) {

  return new Promise((resolve,reject) => {

  // let passwordReg = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9\.\-\_\!]+){6,15}$/g;

  // if (!passwordReg.test(password)) {
  //   return reject('Password must contain at least one digit and be between 6 and 15 characters long.');
  // } else if (password.length < 6 || password.length > 15) {
  //   return reject('Password must be in between 6 and 15 characters');
  // }
  require('machinepack-passwords').encryptPassword({
    password: password
  }).exec({
    error: function (err) {
      req.wantsJSON = true;
      if (!password) {
        //return res.badRequest('Missing password field');
        return reject( 'Missing password field');
      }
      return reject(err);
    },
    success: (enryptedPass) => {
      return resolve(enryptedPass);
    }
  });
  });
};


module.exports.getMyEncryptedPassword = function (password, callback) {
  require('machinepack-passwords').encryptPassword({
    password: password
  }).exec({
    error: function (err) {
      // req.wantsJSON = true;
      if (!password) {
        return callback('Missing password field', null);
      }
      return res.negotiate(err);
    },
    success: function (encryptedPassword) {
      return callback(null, encryptedPassword);
    }
  });
};

module.exports.isMatchedPasswordAsync = function (password, user, cb) {
  return new Promise((resolve,reject) => {
  require('machinepack-passwords').checkPassword({
    passwordAttempt: password,
    encryptedPassword: user.password
  }).exec({
    // An unexpected error occurred.
    error: function (err) {
      return reject(err);
    },
    // Password attempt does not match already-encrypted version
    incorrect: function () {
      return reject(err);
    },
    // OK.
    success: function () {
      return resolve(true);
    }
  });
});
};



/**
 * a helper method to process error object and return apporpriate message based on status if err = instance of CustomError
 * @param {CustomError|Error} err - standard error
 * @param res - sails response object
 * @param {string} [responseFormat] - possible values: xml, json
 */
module.exports.errorResponse = function(err, res, responseFormat){
  let rsp = {}, _status = 500;
  if(!err) err = '';
  if(err instanceof CustomError){
    rsp = {err: err.message};
    if(err.errors){
      rsp.errors = _.clone(err.errors);
    }

    if(typeof err === 'object'){
      for(let prop in err){
        if(['message', 'status', 'errors', 'error', 'name', 'stack'].indexOf(prop) !== -1)continue;
        rsp[prop] = err[prop];
      }
    }

    _status = err.status || 500;



  }else if(err instanceof Error){
    rsp = {err: err.message};
  }else{
    rsp = err;
  }

  _status === 500 && sails.log.error(err);
  _status !== 500 && sails.log.verbose(err);

  if(responseFormat && responseFormat === 'xml'){
    const xml = require('xml');
    res.setHeader("Content-type", "text/xml");
    return res.send(xml(FeedService.objToXmlArray(rsp), {declaration: true}), _status);
  }else{
    res.send(rsp, _status);
  }
};

  module.exports.string = {
    random: {
      // Returns random integer
      number: function (length) {
        return random.integer({length: length});
      },
  
      // Returns random lowercase string
      lower: function (length) {
        return random.string({length: length, pool: _small});
      },
  
      // Returns random uppercase string
      upper: function (length) {
        return random.string({length: length, pool: _capital});
      },
  
      // Returns random uppercase/lowercase string
      letters: function (length) {
        return random.string({length: length, pool: _small + _capital});
      },
  
      // Returns random alpha-numeric string
      alphaNum: function (length) {
        return random.string({length: length, pool: _small + _capital + _num});
      },
  
      // Returns random alpha-numeric string with $ and ! characters
      any: function (length) {
        return random.string({length: length});
      },
      getPassword : () => {
        const passwordReg = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9\.\-]+){6,15}$/;
        return new RandExp(passwordReg).gen().slice(-14);
      }
    },
    capitalise: function(str){
      return str.split('_')
          .map((_str)=>_str.charAt(0).toUpperCase() + _str.slice(1).toLowerCase())
          .join(' ');
    },
    replaceAll: (str, find, replace) => {
      function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      }
  
      return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    },
  
    /**
     * replace UUID in a string with text
     * @param {string} str - target string
     * @param {string} [replaceWith] - text that you want to put in place of UUID
     * @returns {string}
       */
    replaceUUID: function(str, replaceWith){
      replaceWith = _.isString(replaceWith) ? replaceWith : '';
      return str.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-)?/ig, replaceWith);
    }
  
  

};

