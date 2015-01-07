'use strict';

var think = require('thinkjs-util');
var lexer = require('../../util/lexer.js');
var TOKEN = require('../../util/token.js');
var config = require('./config.js');


var atType = config.atType;

module.exports = think.Class(lexer, {
  /**
   * prev token type
   * @type {Number}
   */
  prevTokenType: 0,
  /**
   * get next token
   * @return {void} []
   */
  getNextToken: function(){
    var token = this._getNextToken();
    if (token || token === false) {
      return token;
    }
    var code = this._text.charCodeAt(this.pos);
    console.log(this._text[this.pos]);
    switch(code){
      case 0x40: //@
        return this.getAtToken();
      case 0x7b: //{
        this.prevTokenType = TOKEN.CSS_LEFT_BRACE;
        return this.getToken(TOKEN.CSS_LEFT_BRACE, this.next());
      case 0x7d: //}
        this.prevTokenType = TOKEN.CSS_RIGHT_BRACE;
        return this.getToken(TOKEN.CSS_RIGHT_BRACE, this.next());
      case 0x3a: //:
        this.prevTokenType = TOKEN.CSS_COLON;
        return this.getToken(TOKEN.CSS_COLON, this.next());
      case 0x3b: //;
        this.prevTokenType = TOKEN.CSS_SEMICOLON;
        return this.getToken(TOKEN.CSS_SEMICOLON, this.next());
      case 0x5b: //[
        // for hack [;color: red;]
        var ret = this.getMatched('[', ']');
        if (ret) {
          this.prevTokenType = TOKEN.CSS_BRACK_HACK;
          return this.getToken(TOKEN.CSS_BRACK_HACK, ret);
        }
    }
    if (this.prevTokenType === TOKEN.CSS_COLON) {
      return this.getValueToken();
    }
    return false;
    return this.getSelectorOrNameToken();
  },
  /**
   * get value token
   * @return {Object} []
   */
  getValueToken: function(){

  },
  /**
   * get selector or name token
   * @return {Object} []
   */
  getSelectorOrNameToken: function(){

  },
  /**
   * get @ token
   * @return {Object} []
   */
  getAtToken: function(){
    var i = 0, item, code, ret = '', length, str, chr;
    this.record();
    for(;item = atType[i++];){
      if (!this.lookAt(item[0])) {
        continue;
      }
      length = item[0].length;
      code = this._text.charCodeAt(this.pos + length);
      // whitespace or ; or {
      if (code === 0x20 || code === 0x3b || code === 0x7b) {
        ret = this.forward(length);
        while(true){
          code = this._text.charCodeAt(this.pos);
          if (code === 0x2f) {
            str = this.getComment('multi');
            if (str) {
              ret += str.value;
              continue;
            }
          }else if (code === 0x22 || code === 0x27) {
            str = this.getQuote();
            ret += str;
            continue;
          }
          // ; 
          if (code === 0x3b) {
            ret += this.next();
            break;
          }
          // {
          if (code === 0x7b) {
            break;
          }
          chr = this.next();
          if (chr === false) {
            break;
          }
          ret += chr;
        }
        return this.getToken(item[1], ret);
      }
    }
    this.error('get @ token error', true);
  }
})