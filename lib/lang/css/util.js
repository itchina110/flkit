'use strict';

var config = require('./config.js');

var venderPrefix = config.venderPrefix;
var venderPrefixLength = venderPrefix.length;
var propertyHackPrefix = config.propertyHackPrefix;

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
    var _value = value.toLowerCase().trim(), prefix, item;
    for(var i = 0; i < venderPrefixLength; i++){
      item = venderPrefix[i];
      if (_value.indexOf(item) === 0) {
        prefix = item;
        _value = _value.slice(item.length);
        break;
      }
    }
    if (!prefix && propertyHackPrefix[_value[0]]) {
      prefix = _value[0];
      _value = _value.slice(1);
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
  parseValue: function(){

  }
}