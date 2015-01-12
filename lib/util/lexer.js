'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');
var error = require('./error.js');
var TOKEN = require('./token.js');
var config = require('./config.js');
var Message = require('./message.js');

var comments = config.comments;
var TOKEN_VALUE = TOKEN._VALUE;
var lineComments = comments[0];
var whitespace = config.whitespace;


module.exports = think.Class(base, {
  /**
   * text lexer position
   * @type {Number}
   */
  pos: 0,
  /**
   * token position
   * @type {Number}
   */
  tokpos: 0,
  /**
   * text lexer line
   * @type {Number}
   */
  line: 0,
  /**
   * token line
   * @type {Number}
   */
  tokline: 0,
  /**
   * text lexer col
   * @type {Number}
   */
  col: 0,
  /**
   * token col
   * @type {Number}
   */
  tokcol: 0,
  /**
   * newline nums before token
   * @type {Number}
   */
  newlines: 0,
  /**
   * current token newsline before
   * @type {Number}
   */
  toknewlines: 0,
  /**
   * commnets before token
   * @type {Array}
   */
  comments: [],
  /**
   * whitespace list
   * @type {Object}
   */
  whitespace: whitespace,
  /**
   * prev token type
   * @type {Number}
   */
  prevTokenType: 0,
  /**
   * get next char
   * @return {Function} [next char from text]
   */
  next: function(){
    // if (this.pos >= this.length) {
    //   return false;
    // }
    var chr = this.text[this.pos++];
    //0x0a is \n
    if (chr.charCodeAt(0) === 0x0a) {
      this.line++;
      this.col = 0;
      this.newlines++;
    }else{
      this.col++;
    }
    return chr;
  },
  /**
   * forward num chars
   * @param  {Number} i []
   * @return {String}   [forward string]
   */
  forward: function(i){
    var ret = '';
    while (i-- > 0){
      ret += this.next();
    }
    return ret;
  },
  /**
   * skip whitespace
   * @return {void} []
   */
  skipWhiteSpace: function(){
    var whitespace = this.whitespace;
    while(whitespace[this.text[this.pos]]){
      this.next();
    }
  },
  /**
   * check char is white space
   * @param  {String}  chr []
   * @return {Boolean}     []
   */
  isWhiteSpace: function(chr){
    if (think.isNumber(chr)) {
      chr = String.fromCharCode(chr);
    }
    return whitespace[chr];
  },
  /**
   * skip comment
   * sub class override
   * @return {void} []
   */
  skipComment: function(){

  },
  /**
   * look at string in current position
   * @param  {String} str           []
   * @return {Boolean}              []
   */
  lookAt: function(str){
    return str === this._text.substr(this.pos, str.length);
  },
  /**
   * find string, support escape
   * @param  {String} str [find string in text]
   * @return {Number}     [string pos in text]
   */
  find: function(str, forward){
    forward = forward || 0;
    return this._text.indexOf(str, this.pos + forward);
  },
  /**
   * throw error
   * @param  {String} message []
   * @param  {Number} line    []
   * @param  {Number} col     []
   * @return {void}         []
   */
  error: function(message, useRecord){
    if (useRecord) {
      throw new error(message, this._record.line, this._record.col);
    }else{
      throw new error(message, this.line, this.col);
    }
  },
  /**
   * record line & col & pos
   * @return {void} []
   */
  record: function(){
    this._record = {
      line: this.line,
      col: this.col,
      pos: this.pos,
      newlines: this.newlines
    }
  },
  /**
   * rollback parse
   * @return {void} []
   */
  rollback: function(){
    if (!this._record) {
      return false;
    }
    var record = this._record;
    this.line = record.line;
    this.col = record.col;
    this.pos = record.pos;
    this.newlines = record.newlines;
  },
  /**
   * get quote text, support template syntax in quote
   * @return {String} [quote string]
   */
  getQuote: function(options){
    options = options || {};
    var quote = this.next(), quoteCode = quote.charCodeAt(0);
    var ret = quote, escape = false, find = false, tpl, code, chr;
    this.record();
    /*jshint -W084 */
    while(this.pos < this.length){
      //template syntax in quote string
      tpl = this.getTplToken();
      if (tpl) {
        ret += tpl.value;
        continue;
      }
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += this.next();
        continue;
      }
      // chr is quote, but next chr is not
      if (!escape && code === quoteCode) {
        if (!options.checkNext || this.text.charCodeAt(this.pos + 1) !== code) {
          find = true;
          ret += this.next();
          break;
        }
      }
      ret += this.next();
    }
    if (!find) {
      if (options.throwError) {
        this.error(Message.UnMatchedQuoteChar, true);
      }else if (options.rollback) {
        this.rollback();
        return {
          value: quote,
          find: false
        };
      }
    }
    return {
      value: ret,
      find: find
    }
  },
  /**
   * get matched string
   * not supoort tpl, nested, quote
   * @param  {String} start []
   * @param  {String} end   []
   * @return {String}       []
   */
  getMatched: function(start, end){
    if (!this.lookAt(start)) {
      return false;
    }
    var startLength = start.length, endLength = end.length;
    var pos = this.find(end, startLength);
    //can't find end string in text
    if (pos === -1) {
      return false;
    }
    return this.forward(pos - this.pos + endLength);
  },
  /**
   * get match char, such as: [], (), {}
   * @param  {Number} startCode [start char]
   * @param  {Number} endCode   [end char]
   * @return {String}           [matched char]
   */
  getMatchedChar: function(startCode, endCode, options){
    if (this._text.charCodeAt(this.pos) !== startCode) {
      return false;
    }
    options = options || {};
    var code, escape = false, nextCode, comment, nums = 0;
    var ret = this.next(), chr;
    var quote = options.quote;
    var multi_comment = options.multi_comment;
    var line_comment = options.line_comment;
    var nest = options.nest;
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x5c || escape) {
        escape = !escape;
        ret += this.next();
        continue;
      }
      if (quote && !escape && (code === 0x22 || code === 0x27)) {
        ret += this.getQuote({
          rollback: true
        }).value;
        continue;
      }
      if (code === 0x2f) {
        nextCode = this.text.charCodeAt(this.pos + 1);
        comment = '';
        if (multi_comment && nextCode === 0x2a) {
          comment = this.getCommentToken(1, 0, false);
        }else if (line_comment && nextCode === 0x2f) {
          comment = this.getCommentToken(0, 1, false);
        }
        if (comment) {
          ret += comment.value;
          continue;
        }
      }
      if (nest && code === startCode) {
        nums++;
      }else if (code === endCode) {
        if (!nest || nums === 0) {
          ret += this.next();
          return ret;
        }
        nums--;
      }
      ret += this.next();
    }
    return ret;
  },
  /**
   * start token
   * @return {void} []
   */
  startToken: function(){
    this.tokline = this.line;
    this.tokcol = this.col;
    this.tokpos = this.pos;
    this.toknewlines = this.newlines;
  },
  /**
   * get template token
   * @return {Object} []
   */
  getTplToken: function(){
    if (!this.hasTpl) {
      return false;
    }
    var length = this.ld.length, ld, rd, tplInstance = this.getTplInstance();
    var ret, _value;
    for(var i = 0; i < length; i++){
      ld = this.ld[i];
      rd = this.rd[i];
      ret = tplInstance.getMatched(ld, rd, this);
      if (ret) {
        if (ret.slice(0 - rd.length) === rd) {
          _value = ret.slice(ld.length, 0 - rd.length);
        }else{
          _value = ret.slice(ld.length);
        }
        return this.getToken(TOKEN.TPL, ret, {
          ld: ld,
          rd: rd,
          _value: _value
        });
      }
    }
    return false;
  },
  /**
   * check next chars is template syntax
   * @return {Boolean} []
   */
  isTplNext: function(){
    if (!this.hasTpl) {
      return false;
    }
    var length = this.ld.length;
    for(var i = 0; i < length; i++){
      if (this.lookAt(this.ld[i])) {
        return true;
      }
    }
    return false;
  },
  /**
   * get next token
   * @return {Object} []
   */
  _getNextToken: function(){
    this.skipWhiteSpace();
    this.skipComment();
    this.startToken();
    var token = this.getTplToken();
    if (token !== false) {
      return token;
    }
    if (this.pos >= this.length) {
      return this.getLastToken();
    }
  },
  /**
   * get next token
   * sub class override this method
   * @return {Object} []
   */
  getNextToken: function(){

  },
  /**
   * get token info
   * @param  {String} type  []
   * @param  {String} value []
   * @return {Object}       []
   */
  getToken: function(type, value, extra){
    var data = {
      type: type,
      value: value || '',
      name: TOKEN_VALUE[type],
      line: this.tokline,
      col: this.tokcol,
      pos: this.tokpos,
      newlines: this.toknewlines,
      comments: this.comments
    }
    if (extra) {
      for(var key in extra){
        data[key] = extra[key];
      }
    }
    this.newlines = 0;
    this.comments = [];
    return data;
  },
  /**
   * get last token
   * @return {Object} []
   */
  getLastToken: function(){
    if (this.newlines || this.comments.length) {
      return this.getToken(TOKEN.EOS);
    }
    return false;
  },
  /**
   * get comment string
   * @param  {String} type           []
   * @return {Object}                []
   */
  getCommentToken: function(type, number, noskip){
    this.record();
    var result;
    if (type === 0) {
      result = this.getLineComment(number);
    }else{
      var value =  comments[type];
      result = this.getMatched(value[0], value[1]);
    }
    if (!result) {
      return false;
    }
    var data = {
      value: result,
      line: this._record.line,
      col: this._record.col,
      pos: this._record.pos,
      newlines: this._record.newlines
    }
    this.newlines = 0;
    if (noskip !== false) {
      this.skipWhiteSpace();
    }
    return data;
  },
  /**
   * get line comment
   * @return {Object} []
   */
  getLineComment: function(number){
    number = (number || 1).toString(2).split('');
    var i = 0, length = number.length, item, chr, ret = '';
    for(;i < length; i++){
      if (number[i] === '0') {
        continue;
      }
      item = lineComments[i];
      if (!this.lookAt(item)) {
        continue;
      }
      ret = this.forward(item.length);
      /*jshint -W084 */
      for(;chr = this.text[this.pos];){
        if (chr === '\n') {
          break;
        }
        ret += this.next();
      }
      break;
    }
    return ret;
  },
  /**
   * run
   * @return {Array} [text tokens]
   */
  run: function(options){
    this.super('run', options);
    var ret = [], token;
    /*jshint -W084 */
    for(;token = this.getNextToken();){
      this.prevTokenType = token.type;
      ret.push(token);
    }
    return ret;
  }
})