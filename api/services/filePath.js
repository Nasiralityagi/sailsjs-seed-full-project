var path = require('path');

module.exports.fileUrl = function (str) {
    if (typeof str !== 'string') {
        throw new Error('Expected a string');
    }

    var pathName = path.resolve(str).replace(/\\/g, '/');
    const index = pathName.indexOf('assets/') + 7
    pathName = pathName.substr(index, pathName.length);
    pathName = 'http://'+sails.config.Host+':'+sails.config.port+'/' + pathName;
    // console.log(sails.config.explicitHost , sails.config.port );

    return encodeURI(pathName);
};

