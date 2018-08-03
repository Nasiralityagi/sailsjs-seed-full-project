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

  return new Promise((resolve, reject) => {

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
          return reject('Missing password field');
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

module.exports.isMatchedPasswordAsync = function (password, dbPassword, cb) {
  return new Promise((resolve, reject) => {
    require('machinepack-passwords').checkPassword({
      passwordAttempt: password,
      encryptedPassword: dbPassword
    }).exec({
      // An unexpected error occurred.
      error: function (err) {
        return reject(err);
      },
      // Password attempt does not match already-encrypted version
      incorrect: function () {
        return reject({ error: 'User password is incorrect' });
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
module.exports.errorResponse = function (err, res, responseFormat) {
  let rsp = {}, _status = 500;
  if (!err) err = '';
  if (err instanceof CustomError) {
    rsp = { err: err.message };
    if (err.errors) {
      rsp.errors = _.clone(err.errors);
    }

    if (typeof err === 'object') {
      for (let prop in err) {
        if (['message', 'status', 'errors', 'error', 'name', 'stack'].indexOf(prop) !== -1) continue;
        rsp[prop] = err[prop];
      }
    }

    _status = err.status || 500;



  } else if (err instanceof Error) {
    rsp = { err: err.message };
  } else {
    rsp = err;
  }

  _status === 500 && sails.log.error(err);
  _status !== 500 && sails.log.verbose(err);

  if (responseFormat && responseFormat === 'xml') {
    const xml = require('xml');
    res.setHeader('Content-type', 'text/xml');
    return res.send(xml(FeedService.objToXmlArray(rsp), { declaration: true }), _status);
  } else {
    res.status(_status).send(rsp)
    // res.send(rsp, _status);
  }
};

module.exports.string = {
  random: {
    // Returns random integer
    number: function (length) {
      return random.integer({ length: length });
    },

    // Returns random lowercase string
    lower: function (length) {
      return random.string({ length: length, pool: _small });
    },

    // Returns random uppercase string
    upper: function (length) {
      return random.string({ length: length, pool: _capital });
    },

    // Returns random uppercase/lowercase string
    letters: function (length) {
      return random.string({ length: length, pool: _small + _capital });
    },

    // Returns random alpha-numeric string
    alphaNum: function (length) {
      return random.string({ length: length, pool: _small + _capital + _num });
    },

    // Returns random alpha-numeric string with $ and ! characters
    any: function (length) {
      return random.string({ length: length });
    },
    getPassword: () => {
      const passwordReg = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9\.\-]+){6,15}$/;
      return new RandExp(passwordReg).gen().slice(-14);
    }
  },
  capitalise: function (str) {
    return str.split('_')
      .map((_str) => _str.charAt(0).toUpperCase() + _str.slice(1).toLowerCase())
      .join(' ');
  },
  replaceAll: (str, find, replace) => {
    function escapeRegExp(str) {
      return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    }

    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  },

  /**
   * replace UUID in a string with text
   * @param {string} str - target string
   * @param {string} [replaceWith] - text that you want to put in place of UUID
   * @returns {string}
     */
  replaceUUID: function (str, replaceWith) {
    replaceWith = _.isString(replaceWith) ? replaceWith : '';
    return str.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-)?/ig, replaceWith);
  }



};
var moment = require('moment');
module.exports.sendNotification = async function (days) {

  // let lastMonth = moment(Date.now()).subtract(1, 'months');
  // let daysInLastMonth = moment(lastMonth, 'YYYY-MM').daysInMonth()
  // let daysDiff = daysInLastMonth - days;
  // let date = moment().subtract(daysDiff, 'days').calendar();
  var today = new Date();
  var myToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  let date = moment(myToday).add(days, 'days').format('YYYY-MM-DD HH:mm:ss');
  let queryObject = {
    where: { status_id: { '!=': Status.DELETED }, expiration_date: { 'like': date } },
  };

  const ConnRenewal_count = await ConnRenewal.count({ where: { status_id: { '!=': Status.DELETED }, expiration_date: { 'like': date } } });
  if (!ConnRenewal_count) {
    return new CustomError('ConnRenewal not found', {
      status: 403
    });
  }
  let connRenewal = await ConnRenewal.find(queryObject).populate('userconnection');
  if (!connRenewal) {
    return new CustomError('connRenewal not found', {
      status: 403
    });
  }
  // grouped data by dealer id

  var newdata = _.groupBy(connRenewal, 'userconnection.dealer');

  // Foreach only used for group by
  _.forEach(newdata, async function (value, key) {
    let arrobj = [];
    const user = await User.findOne({ id: key });
    if (!user) {
      return new CustomError('user not found', {
        status: 403
      });
    }
    for (let v of value) {
      let cObj = {
        username: '',
        // customer: '',
        areadealer: '',
        activationDate: '',
        contact: '',
        package: '',
      };

      const customer = await Customers.findOne({ id: v.userconnection.customers });
      if (!customer) {
        return new CustomError('customer not found', {
          status: 403
        });
      }
      else {
        // const packageDb = await Packages.findOne({ id: v.userconnection.packages });
        const packageDb = await Packages.findOne({ id: v.userconnection.packages });
        if (!packageDb) {
          sails.log('error in package');
          return 'error in package';
        }
        cObj.contact = customer.mobile;
        cObj.username = customer.first_name;
        cObj.areadealer = user.first_name;
        cObj.activationDate = date;
        cObj.package = packageDb.package_name;
        arrobj.push(cObj);
      }
    }
    sails.log('send mail to ', user.email == null ? 'email not found' : user.email);
    if (user.email) {
      hybridNotification.sendMail(arrobj, user.email, days);
    }
  });

  // console.log('return');
  return 'ok';

};
var jobs = [];
var CronJob = require('cron').CronJob;
module.exports.cronStart = async function (id, time, expire) {
  jobs[id] = new CronJob({
    cronTime: time, //'* * * * *',
    onTick: function () {
      sails.log('job ' + id + ' ticked ' + expire);

      util.sendNotification(expire)
        .then(result => {
          //console.log('result ' , result);
        })
        .catch(err => {
          sails.log('err ', err);
        });

    },
    start: false,
    timeZone: 'America/Los_Angeles'
  });
  jobs[id].start();

};
module.exports.cronStop = async function (id) {
  jobs[id].stop();
  return true;
};

module.exports.uploadFileAsync = async function (file, file_name, filePath) {
  return new Promise((resolve, reject) => {
    file
      .upload({
        dirname: `${filePath}/${file_name}/`,
        // You can apply a file upload limit (in bytes)
        maxBytes: 10000000000,

      }, function whenDone(err, uploadedFiles) {
        if (err) return reject(err);
        return resolve(uploadedFiles);

      });


  });
};

var request = require('request');
module.exports.sendSMS = async function (_to, _message) {
  var options = {
    method: 'GET',
    url: 'http://lifetimesms.com/json',
    qs:
    {
      username: 'umarbits',
      password: 'umarumar',
      to: _to,
      from: '8584',
      message: _message
    }
  };

  console.log('message: ', _message);

  // console.log('response')

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        console.log('sms err: ', error);
        return reject(error);
      } else {
        console.log('sms body: ', body);
        return resolve(body);
      }
    });

  })

}
module.exports.customerDelete = function () {
  const cDelete = new CronJob({
    cronTime: '0 0 * * *',
    onTick: async function () {
      const customers = await Customers.find({
        where: { status_id: Status.PENDING }
      });

      for (let c of customers) {
        var dbDate = moment.unix(c.updatedAt/1000).format('MM/DD/YYYY');
        var cmpDate = moment().subtract(3, 'd').format('MM/DD/YYYY');
        if (dbDate == cmpDate) {
          const customerUpdate = await Customers.update({
            id: c.id
          }, { status_id: Status.DELETED }).fetch();
          if (customerUpdate) {
            console.log('customer deleted with id : ' + c.id + ' and name : ' + c.first_name);
          }
        }

      }
    },
    start: false,
    timeZone: 'America/Los_Angeles'
  });
  cDelete.start();

};


module.exports.fileUpload = function (file_of, file_of_id, file_name, file) {

  return new Promise(async (resolve, reject) => {
    const filePath = '../../assets/images/' + file_of + '/';
    if (file) {
      const fileUpload = await util.uploadFileAsync(file, file_name, filePath);
      for (let file of fileUpload) {
        const newDoc = await Documents.create({
          'file_name': file.filename,
          'file_path': file.fd,
          'file_of': file_of,
          'file_of_id': file_of_id,
          'status_id': Status.ACTIVE,
        }).fetch();
        if (!newDoc) {
          throw new CustomError('document insertion error', {
            status: 403
          });
        }

        return resolve(newDoc);
      }
    }
  });
}

module.exports.expireConnection = function () {
  const cDelete = new CronJob({
    cronTime: '0 0 * * *',
    onTick: async function () {
      const connRenewal = await ConnRenewal.find({
        where: { status_id: {'!=' : Status.DELETED } }
      });

      for (let c of connRenewal) {
        var dbDate = moment.unix(c.expiration_date/1000).format('MM/DD/YYYY');
        var cmpDate = moment().format('MM/DD/YYYY');
        if (dbDate == cmpDate) {
          const connRenewalUpdate = await ConnRenewal.update({
            id: c.id
          }, { status_id: Status.EXPIRED }).fetch();
          if (connRenewalUpdate) {
            console.log('userconnection expired with id : ' + connRenewalUpdate.userconnection);
          }
        }

      }
    },
    start: false,
    timeZone: 'America/Los_Angeles'
  });
  cDelete.start();

};
// var XLSX = require('xlsx');
// module.exports.process_RS =  function (stream/*:ReadStream*/, cb/*:(wb:Workbook)=>void*/)/*:void*/{
//   var buffers = [];
//   stream.on('data', function(data) { buffers.push(data); });
//   stream.on('end', function() {
//     var buffer = Buffer.concat(buffers);
//     var workbook = XLSX.read(buffer, {type:"buffer"});

//     /* DO SOMETHING WITH workbook IN THE CALLBACK */
//     cb(workbook);
//   });
// }