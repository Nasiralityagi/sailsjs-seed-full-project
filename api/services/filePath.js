var path = require('path');

module.exports.fileUrl = function (str) {
    if (typeof str !== 'string') {
        throw new Error('Expected a string');
    }

    var pathName = path.resolve(str).replace(/\\/g, '/');
    const index = pathName.indexOf('assets/') + 7
    pathName = pathName.substr(index, pathName.length);
    pathName = 'http://192.168.31.92:1337/' + pathName;

    return encodeURI(pathName);
};

