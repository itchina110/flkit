'use strict';

var think = require('thinkjs-util');
var lexer = require('../../util/lexer.js');
var TOKEN = require('../../util/token.js');
var config = require('./config.js');
var baseConfig = require('../../util/config.js');
//var util = require('./util.js');


var atType = config.atType;
var multiComment = baseConfig.comments[1];
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
    if (this.prevTokenType !== TOKEN.CSS_PROPERTY) {
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
        return this.getToken(TOKEN.CSS_LEFT_BRACE, this.next());
      case 0x7d: //}
        return this.getToken(TOKEN.CSS_RIGHT_BRACE, this.next());
      case 0x3a: //:
        if (this.prevTokenType === TOKEN.CSS_PROPERTY) {
          return this.getToken(TOKEN.CSS_COLON, this.next());
        }
        break;
      case 0x3b: //;
        return this.getToken(TOKEN.CSS_SEMICOLON, this.next());
      case 0x5b: //[
        if (this.prevTokenType === TOKEN.CSS_SELECTOR || this.prevTokenType === TOKEN.CSS_VALUE) {
          // for hack [;color: red;]
          var ret = this.getMatched('[', ']');
          if (ret) {
            return this.getToken(TOKEN.CSS_BRACK_HACK, ret);
          }
        }
    }
    switch(this.prevTokenType){
      case TOKEN.CSS_PROPERTY:
        return this.getValueToken();
      case TOKEN.CSS_VALUE:
      case TOKEN.CSS_SELECTOR:
      case TOKEN.CSS_PAGE:
      case TOKEN.CSS_VIEWPORT:
      case TOKEN.CSS_FONT_FACE:
        return this.getPropertyToken();
      default:
        return this.getSelectorToken();
    }
  },
  /**
   * get selector or name token
   * @return {Object} []
   */
  getSelectorToken: function(){
    var ret = '', code, str, token, chr, record, rec, comment, escape = false;
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
      }
      if (code === 0x7b) { // {
        break;
      }
      if (code === 0x2f) {
        rec = this.record();
        comment = this.getCommentToken(1, true);
        if (comment) {
          record = record || rec;
          continue;
        }
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
    if (record) {
      this.rollback(record);
    }
    token = this.getToken(TOKEN.CSS_SELECTOR, ret);
    token.value = this.skipRightSpace(ret);

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
    var escape = false, comments = [], comment;
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += this.next();
        continue;
      }
      // ; or }
      if (code === 0x3b || code === 0x7d) {
        break;
      }
      if (comments.length && !this.isWhiteSpace(chr) && !this.lookAt(multiComment[0])) {
        comments = [];
      }
      if (!escape && (code === 0x22 || code === 0x27)) {
        ret += this.getQuote({
          rollback: true
        }).value;
        continue;
      }else if (code === 0x2f) {
        comment = this.getCommentToken(1, true, !comments.length);
        if (comment) {
          comments.push(comment);
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
      ret += this.next();
    }
    var token = this.getToken(TOKEN.CSS_VALUE, ret);
    token.value = this.skipRightSpace(ret);

    if (comments.length) {
      this.addComment(comments);
    }
    return token;
  },
  /**
   * add comment to next token
   * @param {Array} comments []
   */
  addComment: function(comments){
    switch(comments.length){
      case 1:
        this.commentBefore.push(comments[0]);
        break;
      case 2:
        this.commentBefore.push(comments[0], comments[1]);
        break;
      case 3:
        this.commentBefore.push(comments[0], comments[1], comments[2]);
        break;
      default:
        [].push.call(this.commentBefore, comments);
        break;
    }
  },
  /**
   * skip comment
   * @return {void} []
   */
  skipComment: function(){
    //start with /*
    var comment;
    while(this.text.charCodeAt(this.pos) === 0x2f && this.text.charCodeAt(this.pos + 1) === 0x2a){
      comment = this.getCommentToken(1, 0);
      this.commentBefore.push(comment);
    }
  },
  /**
   * get @ token
   * @return {Object} []
   */
  getAtToken: function(){
    var i = 0, item, code, ret = '', length, str, chr, type = TOKEN.CSS_AT;
    /*jshint -W084 */
    atLabel: for(;item = atType[i++];){
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
    var ret = [], token;
    /*jshint -W084 */
    for(;token = this.getNextToken();){
      switch(token.type){
        case TOKEN.TPL:
        case TOKEN.CSS_LEFT_BRACE:
        case TOKEN.CSS_RIGHT_BRACE:
        case TOKEN.CSS_COLON:
        case TOKEN.CSS_SEMICOLON:
        case TOKEN.CSS_BRACK_HACK:
          break;
        default:
          this.prevTokenType = token.type;
          break;
      }
      ret.push(token);
    }
    return ret;
  }
})