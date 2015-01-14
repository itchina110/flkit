'use strict';

var think = require('thinkjs-util');
var lexer = require('../../util/lexer.js');
var TOKEN = require('../../util/token.js');
var config = require('./config.js');
//var util = require('./util.js');


var atType = config.atType;
//var isAttrChar = util.isAttrChar;

module.exports = think.Class(lexer, {
  /**
   * options
   * @type {Object}
   */
  options: {
    parse_selector: false,
    parse_value: false,
  },
  /**
   * prev token type
   * @type {Number}
   */
  prevTokenType: 0,
  /**
   * token status
   * @type {Number}
   */
  status: 0,
  /**
   * init method
   * @return {} []
   */
  _init: function(){
    this._text = this.text.toLowerCase();
    this.skipCd();
  },
  /**
   * get next token
   * @return {void} []
   */
  getNextToken: function(){
    var token = this._getNextToken();
    if (token || token === false) {
      return token;
    }
    var type = this.prevTokenType;
    if (type !== TOKEN.CSS_PROPERTY) {
      token = this.getTplToken();
      if (token) {
        return token;
      }
    }
    var code = this._text.charCodeAt(this.pos);
    switch(code){
      case 0x40: //@
        return this.getAtToken();
      case 0x7b: //{
        if (type === TOKEN.CSS_SELECTOR) {
          this.status = 1;
        }
        return this.getToken(TOKEN.CSS_LEFT_BRACE, this.next());
      case 0x7d: //}
        this.status = 0;
        return this.getToken(TOKEN.CSS_RIGHT_BRACE, this.next());
      case 0x3a: //:
        if (type === TOKEN.CSS_PROPERTY) {
          return this.getToken(TOKEN.CSS_COLON, this.next());
        }
        break;
      case 0x3b: //;
        return this.getToken(TOKEN.CSS_SEMICOLON, this.next());
      case 0x5b: //[
        if (type === TOKEN.CSS_SELECTOR || type === TOKEN.CSS_VALUE) {
          // for hack [;color: red;]
          var ret = this.getMatched('[', ']');
          if (ret) {
            return this.getToken(TOKEN.CSS_BRACK_HACK, ret);
          }
        }
    }
    if (type === TOKEN.CSS_PROPERTY) {
      return this.getValueToken();
    }else if (this.status === 1) {
      return this.getPropertyToken();
    }else{
      return this.getSelectorToken();
    }
  },
  /**
   * get selector or name token
   * @return {Object} []
   */
  getSelectorToken: function(){
    var ret = '', code, str, token, chr, record, escape = false;
    /*jshint -W084 */
    while(this.pos < this.length){
      token = this.getTplToken();
      if (token) {
        ret += token.value;
        continue;
      }
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += this.next();
        continue;
      }else if (code === 0x7b) { // {
        break;
      }else if (code === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a) {
        record = record || this.record();
        this.getCommentToken(1, true);
        continue;
      }
      if (!this.isWhiteSpace(chr)) {
        record = undefined;
      }
      if (!escape && (code === 0x22 || code === 0x27)) {
        ret += this.getQuote({
          rollback: true
        }).value;
        continue;
      }else if (code === 0x5b) { // [ ]
        str = this.getMatchedChar(0x5b, 0x5d, {
          quote: true
        });
        if (str) {
          ret += str;
          continue;
        }
      }else if (code === 0x28) { // ( )
        str = this.getMatchedChar(0x28, 0x29, {
          quote: true,
          nest: true
        });
        if (str) {
          ret += str;
          continue;
        }
      }
      ret += this.next();
    }
    token = this.getToken(TOKEN.CSS_SELECTOR, ret);
    token.value = this.skipRightSpace(ret);
    if (record) {
      record.spaceBefore = record.newlineBefore = 0;
      this.rollback(record);
    }
    return token;
  },
  /**
   * get property token
   * @return {Object} []
   */
  getPropertyToken: function(){
    var ret = '', code;
    while(this.pos < this.length){
      code = this.text.charCodeAt(this.pos);
      if(code === 0x3a || code === 0x2f || code === 0x7d || this.isWhiteSpace(code)){
        break;
      }
      ret += this.next();
    }
    return this.getToken(TOKEN.CSS_PROPERTY, ret);
  },
  /**
   * get value token
   * @return {Object} []
   */
  getValueToken: function(){
    var ret = '', code, chr;
    var escape = false, record;
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += this.next();
        continue;
      }else if (code === 0x3b || code === 0x7d) { // ; or }
        break;
      }else if (code === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a) {
        record = record || this.record();
        this.getCommentToken(1, false);
        continue;
      }
      if (!this.isWhiteSpace(chr)) {
        record = undefined;
      }
      if (!escape && (code === 0x22 || code === 0x27)) {
        ret += this.getQuote({
          rollback: true
        }).value;
        continue;
      }else if (code === 0x28) { // ( )
        ret += this.getMatchedChar(0x28, 0x29, {
          nest: true,
          quote: true,
          multi_comment: true
        })
        continue;
      }
      ret += this.next();
    }
    var token = this.getToken(TOKEN.CSS_VALUE, ret);
    token.value = this.skipRightSpace(ret);
    if (record) {
      record.spaceBefore = record.newlineBefore = 0;
      this.rollback(record);
    }
    return token;
  },
  /**
   * skip comment
   * @return {void} []
   */
  skipComment: function(){
    //start with /*
    var comment;
    while(this.text.charCodeAt(this.pos) === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a){
      comment = this.getCommentToken(1, true);
      this.commentBefore.push(comment);
    }
  },
  /**
   * get @ token
   * @return {Object} []
   */
  getAtToken: function(){
    var i = 0, item, code, ret = '', length, chr, type = TOKEN.CSS_AT;
    /*jshint -W084 */
    for(;item = atType[i++];){
      if (!this.lookAt(item[0])) {
        continue;
      }
      length = item[0].length;
      code = this._text.charCodeAt(this.pos + length);
      // whitespace or ; or { or / or ' or " or :
      if (code === 0x20 || code === 0x3b || code === 0x7b || 
          code === 0x2f || code === 0x22 || code === 0x27 || 
          code === 0x3a) {
        ret = this.forward(length);
        type = item[1];
        break;
      }
    }
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a) {
        ret += this.getCommentToken(1).value;
        continue;
      }else if (code === 0x22 || code === 0x27) {
        ret += this.getQuote().value;
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
      ret += this.next();
    }
    var token = this.getToken(type, ret);
    token.value = this.skipRightSpace(ret);
    return token;
  },
  /**
   * run
   * @return {Array} [text tokens]
   */
  run: function(options){
    this._run(options);
    var ret = [], token, type;
    /*jshint -W084 */
    for(;token = this.getNextToken();){
      ret.push(token);
      type = token.type;
      if (type === TOKEN.TPL || type === TOKEN.CSS_LEFT_BRACE ||
          type === TOKEN.CSS_RIGHT_BRACE || type === TOKEN.CSS_COLON ||
          type === TOKEN.CSS_SEMICOLON || type === TOKEN.CSS_BRACK_HACK
        ){
        continue;
      }
      this.prevTokenType = type;
      if (type === TOKEN.CSS_FONT_FACE || 
          type === TOKEN.CSS_PAGE ||
          type === TOKEN.CSS_VIEWPORT ||
          type === TOKEN.CSS_AT) {
        this.status = 1;
      }
    }
    return ret;
  }
})