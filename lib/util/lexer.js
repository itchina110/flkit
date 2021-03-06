'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');
var error = require('./error.js');
var TOKEN = require('./token.js');
var config = require('./config.js');
var Message = require('./message.js');
var util = require('./util.js');

var comments = config.comments;
var TOKEN_VALUE = TOKEN._VALUE;
var lineComments = comments[0];
var cdo = config.cdo;
var isWhiteSpace = util.makePredicate(config.whitespace);


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
  _pos: 0,
  /**
   * text lexer line
   * @type {Number}
   */
  line: 0,
  /**
   * token line
   * @type {Number}
   */
  _line: 0,
  /**
   * text lexer col
   * @type {Number}
   */
  col: 0,
  /**
   * token col
   * @type {Number}
   */
  _col: 0,
  /**
   * newline nums before token
   * @type {Number}
   */
  newlineBefore: 0,
  /**
   * current token newsline before
   * @type {Number}
   */
  _newlineBefore: 0,
  /**
   * space before token
   * @type {Number}
   */
  spaceBefore: 0,
  /**
   * current token space before
   * @type {Number}
   */
  _spaceBefore: 0,
  /**
   * commnets before token
   * @type {Array}
   */
  commentBefore: [],
  /**
   * get next char
   * @return {Function} [next char from text]
   */
  next: function(){
    var chr = this.text[this.pos++];
    //0x0a is \n
    if (chr.charCodeAt(0) === 0x0a) {
      this.line++;
      this.col = 0;
      this.newlineBefore++;
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
    //var whitespace = this.whitespace;
    while(this.isWhiteSpace(this.text.charCodeAt(this.pos))){
      this.spaceBefore++;
      this.next();
    }
  },
  /**
   * check char is white space
   * @param  {String}  chr []
   * @return {Boolean}     []
   */
  isWhiteSpace: isWhiteSpace,
  /**
   * skip comment
   * sub class override
   * @return {void} []
   */
  skipComment: function(){

  },
  /**
   * skip right space for text
   * @param  {String} value []
   * @return {String}       []
   */
  skipRightSpace: function(value){
    var length = value.length, index = length - 1;
    var newlines = 0, spaces = 0, chr, code;
    while(index >= 0){
      chr = value[index];
      code = chr.charCodeAt(0);
      if (this.isWhiteSpace(code)) {
        index--;
        spaces++;
        if (code === 0x0a) {
          newlines++;
        }
        continue;
      }
      break;
    }
    this.newlineBefore += newlines;
    this.spaceBefore += spaces;
    return value.slice(0, index + 1);
  },
  /**
   * skip cdo and cdc string
   * @return {void} []
   */
  skipCd: function(){
    if (this.lookAt(cdo)) {
      this.forward(4);
      this.length -= 3;
    }
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
      newlineBefore: this.newlineBefore,
      spaceBefore: this.spaceBefore
    }
    return this._record;
  },
  /**
   * rollback parse
   * @return {void} []
   */
  rollback: function(record){
    record = record || this._record;
    if (!record) {
      return false;
    }
    this.line = record.line;
    this.col = record.col;
    this.pos = record.pos;
    this.newlineBefore = record.newlineBefore;
    this.spaceBefore = record.spaceBefore;
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
          comment = this.getCommentToken(1, false);
        }else if (line_comment && nextCode === 0x2f) {
          comment = this.getCommentToken(0, false);
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
    this._line = this.line;
    this._col = this.col;
    this._pos = this.pos;
    this._newlineBefore = this.newlineBefore;
    this._spaceBefore = this.spaceBefore;
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
      _type: TOKEN_VALUE[type],
      line: this._line,
      col: this._col,
      pos: this._pos,
      newlineBefore: this._newlineBefore,
      spaceBefore: this._spaceBefore,
      commentBefore: this.commentBefore,
    }
    if (extra) {
      for(var key in extra){
        data[key] = extra[key];
      }
    }
    this.newlineBefore = this.spaceBefore = 0;
    this.commentBefore = [];
    return data;
  },
  /**
   * get last token
   * @return {Object} []
   */
  getLastToken: function(){
    if (this.newlineBefore || this.spaceBefore || this.commentBefore.length) {
      return this.getToken(TOKEN.EOS);
    }
    return false;
  },
  /**
   * get comment string
   * @param  {String} type           []
   * @return {Object}                []
   */
  getCommentToken: function(type, skipWhiteSpace, inText){
    this.record();
    var result;
    if (type === 0) {
      result = this.getLineComment();
    }else{
      var value = comments[type];
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
      newlineBefore: this._record.newlineBefore,
      spaceBefore: this._record.spaceBefore
    }
    if (inText) {
      data.newlineBefore = data.spaceBefore = 0;
    }
    this.newlineBefore = this.spaceBefore = 0;
    if (skipWhiteSpace !== false) {
      this.skipWhiteSpace();
    }
    return data;
  },
  /**
   * get line comment
   * @return {Object} []
   */
  getLineComment: function(){
    if (!this.lookAt(lineComments[0])) {
      return;
    }
    var ret = this.forward(lineComments[0].length);
    var chr, code;
    while(this.pos < this.length){
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      if (code === 0x0a) {
        break;
      }
      ret += this.next();
    }
    return ret;
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
      ret.push(token);
    }
    return ret;
  }
})