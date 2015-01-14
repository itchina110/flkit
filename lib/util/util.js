'use strict';

var think = require('thinkjs-util');

module.exports = {
  /**
   * string to object
   * @param  {String | Array} str []
   * @return {Object}     []
   */
  toHash: function(str){
    if (think.isString(str)) {
      str = str.split('');
    }
    var ret = {};
    var length = str.length;
    for(var i = 0; i < length; i++){
      ret[str[i]] = 1;
    }
    return ret;
  },
  /**
   * make compare function
   * @param  {String} string []
   * @return {Function}        []
   */
  makePredicate: function(string){
    var code = 'switch(code){\n';
    string.split('').forEach(function(chr){
      code += '  case 0x' + chr.charCodeAt(0).toString(16) + ':\n';
    })
    code += '    return true;\n}\nreturn false';
    /*jslint evil: true */
    return new Function('code', code);
  }
}