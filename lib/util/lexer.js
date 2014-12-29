'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');
var util = require('./util.js');
var error = require('./error.js');
var TOKEN = require('./token.js');

var comments = util.comments;


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
  whitespace: util.toObj(' \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'),
  /**
   * get next char
   * @return {Function} [description]
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
   * forward chars
   * @param  {Number} i [description]
   * @return {void}   [description]
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
   * @return {Boolean} [description]
   */
  skipWhiteSpace: function(){
    var flag = false;
    var whitespace = this.whitespace;
    while(whitespace[this.text[this.pos]]){
      flag = true;
      if (this.next() === false) {
        return flag;
      }
    }
    return flag;
  },
  /**
   * skip comment
   * @return {void} [description]
   */
  skipComment: function(){

  },
  /**
   * look at string in current position
   * @param  {String} str           [description]
   * @param  {Boolean} caseSensitive [description]
   * @return {Boolean}               [description]
   */
  lookAt: function(str){
    return str === this._text.substr(this.pos, str.length);
  },
  /**
   * find string, support escape
   * @param  {[type]} str [description]
   * @return {[type]}     [description]
   */
  find: function(str, add, escape){
    add = add || 0;
    var pos = this._text.indexOf(str, this.pos + add);
    if (pos === -1) {
      return -1;
    }
    var length = str.length;
    //0x5c is \
    if (escape && length === 1 && this.text[this.pos - 1].charCodeAt(0) === 0x5c) {
      while(pos !== -1){
        if (this.text[this.pos - 1].charCodeAt(0) !== 0x5c) {
          break;
        }
        pos = this._text.indexOf(str, pos + length);
      }
    }
    return pos;
  },
  /**
   * throw error
   * @param  {[type]} message [description]
   * @param  {[type]} line    [description]
   * @param  {[type]} col     [description]
   * @param  {[type]} pos     [description]
   * @return {[type]}         [description]
   */
  error: function(message, useRecord){
    if (useRecord) {
      throw new error(message, this._record.line, this._record.col, this._record.pos);
    }else{
      throw new error(message, this.line, this.col, this.pos);
    }
  },
  /**
   * record line & col & pos
   * @return {[type]} [description]
   */
  record: function(){
    this._record = {
      line: this.line,
      col: this.col,
      pos: this.pos
    }
  },
  /**
   * get quote text, support template syntax in quote
   * @return {[type]} [description]
   */
  getQuote: function(chr){
    var quote = chr || this.next();
    var ret = chr;
    var escape = false;
    var find = false;
    this.record();
    while(true){
      //template syntax in quote string
      var tpl = this.getTplToken();
      if (tpl) {
        ret += tpl.value;
        continue;
      }
      var chr = this.next();
      if (chr === false) {
        break;
      }else if (chr === quote && this.text[this.pos] !== quote) {
        if (escape) {
          escape = false;
        }else{
          find = true;
          ret += chr;
          break;
        }
      }else if (chr.charCodeAt(0) === 0x5c) { // 0x5c is \
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
   * @param  {[type]} start         [description]
   * @param  {[type]} end           [description]
   * @param  {[type]} nestLoop [description]
   * @return {[type]}               [description]
   */
  getMatched: function(start, end, nestLoop){
    if (!this.lookAt(start)) {
      return false;
    }
    var startLength = start.length;
    var endLength = end.length;
    var pos = this.find(end, startLength);
    //can't find end string in text
    if (pos === -1) {
      return false;
    }
    this.record();
    var startStr = this.forward(startLength);
    var startPos = this.pos;
    var substr = this._text.substr(startPos, pos - startPos);
    var ret;
    //allow nests loop
    //<% $var = <% $value %> + 1 %>
    if (nestLoop && substr.indexOf(start) > -1) {
      var nests = substr.split(start);
      this.forward(substr.length + endLength);
      while(true){
        pos = this.find(end);
        if (pos > -1) {
          substr = this._text.substr(startPos, pos - startPos);
          this.forward(pos - this.pos + endLength);
          if (substr.split(start).length === substr.split(end).length) {
            break;
          }
        }else{
          this.error('get matched string `' + start + '` & `' + end + '` error', true);
        }
      }
      ret = this.text.substr(startPos, this.pos - startPos) + this.forward(endLength);
    }else{
      ret = this.forward(substr.length + endLength);
    }
    //fixed quote char in <input value=""" />
    if (endLength === 1) {
      while(end === this._text[this.pos]){
        ret += end;
        this.next();
      }
    }
    return startStr + ret;
  },
  /**
   * start token
   * @return {void} [description]
   */
  startToken: function(){
    this.tokline = this.line;
    this.tokcol = this.col;
    this.tokpos = this.pos;
    this.toknewlines = this.newlines;
  },
  /**
   * get template token
   * @return {Object} [description]
   */
  getTplToken: function(){
    if (!this.hasTpl) {
      return false;
    }
    var length = this.ld.length;
    for(var i = 0; i < length; i++){
      var ret = this.getMatched(this.ld[i], this.rd[i]);
      if (ret) {
        return this.getToken(TOKEN.TPL, ret);
      }
    }
    return false;
  },
  /**
   * check next chars is template syntax
   * @return {Boolean} [description]
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
   * @return {Object} [description]
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
   * @return {Object} [description]
   */
  getNextToken: function(){

  },
  /**
   * get token info
   * @param  {String} type  [description]
   * @param  {String} value [description]
   * @return {Object}       [description]
   */
  getToken: function(type, value){
    var data = {
      type: type || '',
      value: value || '',
      name: TOKEN.getName(type),
      line: this.tokline,
      col: this.tokcol,
      pos: this.tokpos,
      newlines: this.toknewlines,
      comments: this.comments
    }
    this.newlines = 0;
    this.comments = [];
    return data;
  },
  /**
   * get last token
   * @return {Object} [description]
   */
  getLastToken: function(){
    if (this.newlines || this.comments.length) {
      return this.getToken(TOKEN.LAST);
    }
    return false;
  },
  /**
   * get comment string
   * @param  {[type]} type           [description]
   * @param  {[type]} skipWhiteSpace [description]
   * @param  {[type]} returnArray    [description]
   * @return {[type]}                [description]
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
      newlines: this.newlines
    }
    this.newlines = 0;
    this.skipWhiteSpace();
    return data;
  },
  /**
   * run
   * @return {[type]} [description]
   */
  run: function(){
    this.super('run');
    var ret = [], token;
    for(;token = this.getNextToken();){
      ret.push(token);
    }
    return ret;
  }
})