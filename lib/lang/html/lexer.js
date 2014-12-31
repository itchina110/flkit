'use strict';

var lexer = require('../../util/lexer.js');
var think = require('thinkjs-util');
var TOKEN = require('../../util/token.js');
var util = require('./util.js');
var config = require('./config.js');


var specialTokens = config.specialTokens;
var specialLength = specialTokens.length;
var isArray = think.isArray;
var reservedCommentPrefix = config.reservedCommentPrefix;
var reservedCommentLength = reservedCommentPrefix.length;
var isTagFirstChar = util.isTagFirstChar;

module.exports = think.Class(lexer, {
  /**
   * text is xml content
   * @type {Boolean}
   */
  isXML: false,
  /**
   * options
   * @type {Object}
   */
  options: {
    tag_attrs: false
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
    var code = this._text.charCodeAt(this.pos);
    // 0x3c is <
    if (code === 0x3c) {
      token = this.getSpecialToken();
      if (token) {
        return token;
      }
      var nextCode = this._text.charCodeAt(this.pos + 1);
      if (isTagFirstChar(nextCode)) {
        return this.getTagToken();
      }
    }
    return this.getTextToken();
  },
  /**
   * skip white space
   * @return {[type]} [description]
   */
  skipWhiteSpace: function(){
    while(true){
      var code = this.text.charCodeAt(this.pos);
      if (code !== 0x0a) {
        break;
      }
      this.next();
    }
  },
  /**
   * get text token
   * @return {[type]} [description]
   */
  getTextToken: function(){
    var ret = '', chr;
    /*jshint -W084 */
    for(;chr = this.next();){
      ret += chr;
      if (chr.charCodeAt(0) === 0x0a) {
        this.newlines--;
      }
      if (this.isTplNext()) {
        break;
      }
      var nextCode = this._text.charCodeAt(this.pos);
      var next2Code = this._text.charCodeAt(this.pos + 1);
      //if next char is < and next2 char is tag first char
      if (nextCode === 0x3c && (next2Code ===  0x21 || isTagFirstChar(next2Code))) {
        break;
      }
    }
    var index = ret.length - 1;
    var times = 0;
    //if last char is \n, remove it
    //and set newlines for next token
    while(ret.charCodeAt(index) === 0x0a){
      times++;
      index--;
    }
    var token = this.getToken(TOKEN.HTML_TEXT, ret.substr(0, index + 1));
    this.newlines += times;
    return token;
  },
  /**
   * get tag token
   * @return {[type]} [description]
   */
  getTagToken: function(){
    this.record();
    var ret = this.next();
    var type, tagEnd = false, chr;
    /*jshint -W084 */
    for(;chr = this.next();){
      var code = this._text.charCodeAt(this.pos - 1);
      if (!type) {
        switch(code){
          case 0x2f: // /
            var nextCode = this._text.charCodeAt(this.pos);
            //if next char is not  >= 'a' && <= 'z', throw error
            if (nextCode >= 0x61 && nextCode <= 0x7a) {
              type = TOKEN.HTML_TAG_END;
            }else{
              this.error('end tag is not valid', true);
            }
            break;
          case 0x3f: // ?
            if (this.lookAt('xml ') || this.lookAt('xml>')) {
              type = TOKEN.HTML_TAG_XML;
              this.isXML = true;
            }else{
              type = TOKEN.HTML_TAG_START;
            }
            break;
          default:
            if (code >= 0x61 && code <= 0x7a) {
              type = TOKEN.HTML_TAG_START;
            }else{
              this.error('tag name is not valid', true);
            }
            break;
        }
      }
      //char is ' or "
      if (code === 0x22 || code === 0x27) {
        ret += this.getQuote(chr);
        continue;
      }
      var tpl = this.getTplToken();
      if (tpl) {
        ret += chr + tpl.value;
        continue;
      }
      //0x3e is >
      if (code === 0x3e) {
        ret += chr;
        tagEnd = true;
        break;
      }
      ret += chr;
    }
    if (!tagEnd) {
      this.error('can\'t find > for tag end', true);
    }
    //get tag attrs
    if (this.options.tag_attrs && type === TOKEN.HTML_TAG_END) {
      return this.getToken(type, ret, {
        tag: ret.slice(1, -1).toLowerCase()
      });
    }
    return this.getToken(type, ret);
  },
  /**
   * get tag attrs
   * @param  {String} tag [tag string]
   * @return {Object}     [tag name & attrs]
   */
  getTagAttrs: function(tag){
    
  },
  /**
   * skip comment
   * @return {void} [description]
   */
  skipComment: function(){
    //start with <!
    while(this.text.charCodeAt(this.pos) === 0x3c && this.text.charCodeAt(this.pos + 1) === 0x21){
      var flag = false;
      for(var i = 0; i < reservedCommentLength; i++){
        if (this.lookAt(reservedCommentPrefix[i])) {
          flag = true;
          break;
        }
      }
      if (flag) {
        break;
      }
      var comment = this.getComment('html');
      if (comment) {
        this.comments.push(comment);
      }else{
        break;
      }
    }
  },
  /**
   * get special token
   * @return {[type]} [description]
   */
  getSpecialToken: function(){
    var pos, npos, findItem, j, length, ret;
    for(var i = 0, item; i < specialLength; i++){
      item = specialTokens[i];
      //if text is not start with item[0], continue
      if (!this.lookAt(item[0])) {
        continue;
      }
      if (isArray(item[1])) {
        pos = -1;
        findItem = '';
        for(j = 0, length = item[1].length; j < length; j++){
          npos = this.find(item[1][j]);
          if (npos === -1) {
            continue;
          }
          if (pos === -1) {
            pos = npos;
            findItem = item[1][j];
          }else if (npos < pos) {
            pos = npos;
            findItem = item[1][j];
          }
        }
        //find end special chars
        if (findItem) {
          length = pos + findItem.length - this.pos;
          ret = this.text.substr(this.pos, length);
          this.forward(length);
          return this.getToken(item[2], ret);
        }
      }else{
        ret = this.getMatched(item[0], item[1]);
        if (ret) {
          return this.getToken(item[2], ret);
        }
      }
    }
    return false;
  }
})