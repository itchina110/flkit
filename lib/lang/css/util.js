'use strict';

var config = require('./config.js');

var browerPrefix = config.browerPrefix;

module.exports = {
  /**
   * is attribute char
   * @return {Boolean} [description]
   */
  isAttrChar: function(code){
    // >= a && <= z or - 
    return code >= 0x61 && code <= 0x7a || code === 0x2d;
  },
  /**
   * parse css property
   * split hack, brower prefix out
   * @return {Obj} []
   */
  parseProperty: function(value){
    var _value = value.toLowerCase().trim(), prefix, i = 0, item, code;
    /*jshint -W084 */
    for(;item = browerPrefix[i++];){
      if (_value.indexOf(item) === 0) {
        prefix = item;
        _value = _value.slice(item.length);
        break;
      }
    }
    if (!prefix) {
      i = 0;
      var length = _value.length;
      while( i < length){
        code = _value.charCodeAt(i);
        // >= a && <= z or - 
        if (code >= 0x61 && code <= 0x7a || code === 0x2d) {
          prefix = _value.slice(0, i);
          _value = _value.slice(i);
          break;
        }
        i++;
      }
    }
    return {
      value: value,
      prefix: prefix,
      _value: _value
    }
  },
  /**
   * parse css value
   * @param  {String} value []
   * @return {Object}       []
   */
  parseValue: function(value){

  }
}