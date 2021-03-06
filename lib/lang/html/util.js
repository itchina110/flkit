'use strict';

var config = require('./config.js');

var jsTplType = config.jsTplType;

module.exports = {
  /**
   * check code is tag name first char
   * @param  {Number}  code [char code]
   * @return {Boolean}      []
   */
  isTagFirstChar: function(code){
    // a-z ! ? /
    return code >= 0x61 && code <= 0x7a || code === 0x3f || code === 0x21 || code === 0x2f;
  },
  /**
   * check code is tag name char
   * @param  {Number}  code [char code]
   * @return {Boolean}      []
   */
  isTagNameChar: function(code){
    // a-z 0-9 : - 
    return code >= 0x61 && code <= 0x7a || code === 0x3a || code === 0x2d || code >= 0x30 && code <= 0x39;
  },
  /**
   * parse script token attribute
   * @param  {Object} token []
   * @return {Object}             []
   */
  parseScriptAttr: function(token){
    var isScript = true, isExternal = false, isTpl = false;
    var attrs = token.attrs || [], i = 0, item, value;
    /*jshint -W084 */
    for(;item = attrs[i++];){
      switch(item._name){
        case 'src':
          isExternal = true;
          break;
        case 'type':
          value = (item._value || '').toLowerCase();
          if (value && value !== 'text/javascript') {
            isScript = false;
            if (value in jsTplType) {
              isTpl = true; 
            }
          }
          break;
      }
    }
    token.isScript = isScript;
    token.isExternal = isExternal;
    token.isTpl = isTpl;
    return token;
  },
  /**
   * parse style attr
   * @param  {Object} token []
   * @return {Object}       []
   */
  parseStyleAttr: function(token){
    var isStyle = true, attrs = token.attrs || [], i = 0, item, value;
    /*jshint -W084 */
    for(;item = attrs[i++];){
      if (item._name === 'type') {
        value = (item._value || '').toLowerCase();
        if (value && value !== 'text/css') {
          isStyle = false;
        }
        break;
      }
    }
    token.isStyle = isStyle;
    return token;
  },
  /**
   * token to text
   * @param  {Array} tokens []
   * @return {String}       []
   */
  token2text: function(tokens){
    return tokens;
  }
}