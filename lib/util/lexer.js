'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');
var error = require('./error.js');
var TOKEN = require('./token.js');
var config = require('./config.js');

var comments = config.comments;
var TOKEN_VALUE = TOKEN._VALUE;
var lineComments = comments.line;


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
  whitespace: config.whitespace,
  /**
   * get next char
   * @return {Function} [next char from text]
   */
  next: function(){
    if (this.pos >= this.length) {
      return false;
    }
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
  find: function(str, forward, escape){
    forward = forward || 0;
    var pos = this._text.indexOf(str, this.pos + forward);
    if (pos === -1) {
      return -1;
    }
    var length = str.length;
    //0x5c is \
    if (escape && length === 1 && this.text.charCodeAt(this.pos - 1) === 0x5c) {
      while(pos !== -1){
        if (this.text.charCodeAt(this.pos - 1) !== 0x5c) {
          break;
        }
        pos = this._text.indexOf(str, pos + length);
      }
    }
    return pos;
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
   * get quote text, support template syntax in quote
   * @return {String} [quote string]
   */
  getQuote: function(chr){
    var quote = chr || this.next(), quoteCode = quote.charCodeAt(0);
    var ret = quote, escape = false, find = false, tpl, code;
    this.record();
    while(true){
      //template syntax in quote string
      tpl = this.getTplToken();
      if (tpl) {
        ret += tpl.value;
        continue;
      }
      chr = this.next();
      if (chr === false) {
        break;
      }
      code = chr.charCodeAt(0);
      if (code === quoteCode && this.text.charCodeAt(this.pos) !== code) { // chr is quote, but next chr is not
        if (escape) {
          escape = false;
        }else{
          find = true;
          ret += chr;
          break;
        }
      }else if (code === 0x5c) { // 0x5c is \
        escape = !escape;
      }else{
        escape = false;
      }
      ret += chr;
    }
    if (!find) {
      this.error("can't find matched quote string", true);
    }
    return ret;
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
  getComment: function(type){
    this.record();
    var value = comments[type];
    var result = this.getMatched(value[0], value[1]);
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
    this.skipWhiteSpace();
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
      for(;chr = this.next();){
        ret += chr;
        if (chr === '\n') {
          break;
        }
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
      ret.push(token);
    }
    return ret;
  }
})