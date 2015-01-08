'use strict';

var think = require('thinkjs-util');
var lexer = require('../../util/lexer.js');
var TOKEN = require('../../util/token.js');
var config = require('./config.js');
var util = require('./util.js');


var atType = config.atType;
var isAttrChar = util.isAttrChar;

module.exports = think.Class(lexer, {
  /**
   * options
   * @type {Object}
   */
  options: {
    parse_selector: false
  },
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
    return this.getSelectorOrPropertyToken();
  },
  /**
   * get value token
   * @return {Object} []
   */
  getValueToken: function(){
    return false;
  },
  /**
   * get selector or name token
   * @return {Object} []
   */
  getSelectorOrPropertyToken: function(){
    var ret = '', code, str, token, type, chr;
    this.record();
    while(true){
      token = this.getTplToken();
      if (token) {
        ret += token.value;
        continue;
      }
      code = this._text.charCodeAt(this.pos);
      if (code === 0x7b) {
        type = TOKEN.CSS_SELECTOR;
        break;
      }else if(code === 0x3a){
        type = TOKEN.CSS_PROPERTY;
        break;
      }else if (code === 0x2f) {
        str = this.getCommentToken(1);
        if (str) {
          ret += str.value;
          continue;
        }
      }else if (code === 0x22 || code === 0x27) {
        ret += this.getQuote();
        continue;
      }else if (code === 0x5b) {
        str = this.getMatched('[', ']');
        if (str) {
          ret += str;
          continue;
        }
      }
      chr = this.next();
      if (chr === false) {
        break;
      }
      ret += chr;
    }
    return this.getToken(type, ret);
  },
  /**
   * skip comment
   * @return {void} []
   */
  skipComment: function(){
    //start with /*
    while(this.text.charCodeAt(this.pos) === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a){
      var comment = this.getCommentToken(1);
      if (comment) {
        this.comments.push(comment);
      }else{
        break;
      }
    }
  },
  /**
   * get @ token
   * @return {Object} []
   */
  getAtToken: function(){
    var i = 0, item, code, ret = '', length, str, chr, type = TOKEN.CSS_AT;
    /*jshint -W084 */
    for(;item = atType[i++];){
      if (!this.lookAt(item[0])) {
        continue;
      }
      length = item[0].length;
      code = this._text.charCodeAt(this.pos + length);
      // whitespace or ; or { or / or ' or "
      if (code === 0x20 || code === 0x3b || code === 0x7b || code === 0x2f || code === 0x22 || code === 0x27) {
        ret = this.forward(length);
        type = item[1];
        break;
      }
    }
    while(true){
      code = this._text.charCodeAt(this.pos);
      if (code === 0x2f) {
        str = this.getCommentToken(1);
        if (str) {
          ret += str.value;
          continue;
        }
      }else if (code === 0x22 || code === 0x27) {
        ret += this.getQuote();
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
    return this.getToken(type, ret);
  }
})