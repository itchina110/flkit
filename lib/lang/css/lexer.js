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
    parse_property: false,
    parse_selector: false,
    parse_value: false,
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
    var code = this._text.charCodeAt(this.pos);
    switch(code){
      case 0x40: //@
        return this.getAtToken();
      case 0x7b: //{
        return this.getToken(TOKEN.CSS_LEFT_BRACE, this.next());
      case 0x7d: //}
        return this.getToken(TOKEN.CSS_RIGHT_BRACE, this.next());
      case 0x3a: //:
        return this.getToken(TOKEN.CSS_COLON, this.next());
      case 0x3b: //;
        return this.getToken(TOKEN.CSS_SEMICOLON, this.next());
      case 0x5b: //[
        // for hack [;color: red;]
        var ret = this.getMatched('[', ']');
        if (ret) {
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
    var ret = '', code, nextCode, chr = this.text[this.pos];
    var escape = false, comment;
    while(true){
      code = this._text.charCodeAt(this.pos);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += chr;
        continue;
      }
      if (code === 0x22 || code === 0x27) {
        ret += this.getQuote().value;
        continue;
      }else if (code === 0x2f) {
        comment = this.getCommentToken(1, 0, false);
        if (comment) {
          ret += comment.value;
          continue;
        }
      }else if (code === 0x28) { // ( )
        ret += this.getMatchedChar(0x28, 0x29, {
          nest: true,
          quote: true,
          multi_comment: true,
          line_comment: true
        })
        continue;
      }
      nextCode = this._text.charCodeAt(this.pos + 1);
      //next is ; or }
      if (nextCode === 0x3b || nextCode === 0x7d) {
        ret += this.next();
        break;
      }
      chr = this.next();
      if (chr === false) {
        break;
      }
      ret += chr;
    }
    var index = ret.length - 1;
    var times = 0;
    //if last char is \n, remove it
    //and set newlines for next token
    while(ret.charCodeAt(index) === 0x0a){
      times++;
      index--;
    }
    ret = ret.substr(0, index + 1).trim();
    this.newlines += times;
    return this.getToken(TOKEN.CSS_VALUE, ret);
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
        ret += this.getQuote().value;
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
    //remove white space for property
    if (type === TOKEN.CSS_PROPERTY) {
      ret = ret.trim();
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
      chr = this.next();
      if (chr === false) {
        break;
      }
      ret += chr;
    }
    return this.getToken(type, ret);
  }
})