'use strict';
var lexer = require('../../util/lexer.js');
var think = require('thinkjs-util');
var TOKEN = require('../../util/token.js');

module.exports = think.Class(lexer, {
  /**
   * text is xml content
   * @type {Boolean}
   */
  isXML: false,
  /**
   * don't skip whitespace in html
   * @return {Boolean} [description]
   */
  skipWhiteSpace: function(){
    return false;
  },
  /**
   * get next token
   * @return {[type]} [description]
   */
  getNextToken: function(){
    var token = this._getNextToken();
    if (token || token === false) {
      return token;
    }
    
  }
})