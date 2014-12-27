'use strict';

var think = require('thinkjs-util');

module.exports = {
  /**
   * comment type list
   * @type {Object}
   */
  comments: {
    line: ['//', '\n'],
    multi: ['/*', '*/'],
    html: ['<!--', '-->']
  },
  /**
   * string to object
   * @param  {String} str [description]
   * @return {Object}     [description]
   */
  toObj: function(str){
    if (think.isString(str)) {
      str = str.split('');
    }
    var ret = {};
    var length = str.length;
    for(var i = 0; i < length; i++){
      ret[str[i]] = 1;
    }
    return ret;
  }
}