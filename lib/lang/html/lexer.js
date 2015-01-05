'use strict';

var lexer = require('../../util/lexer.js');
var think = require('thinkjs-util');
var TOKEN = require('../../util/token.js');
var util = require('./util.js');
var config = require('./config.js');
var baseConfig = require('../../util/config.js');


var specialTokens = config.specialTokens;
var rawTokens = config.rawTokens;
var isArray = think.isArray;
var reservedCommentPrefix = config.reservedCommentPrefix;
var reservedCommentLength = reservedCommentPrefix.length;
var isTagFirstChar = util.isTagFirstChar;
var isTagNameChar = util.isTagNameChar;
var whitespace = baseConfig.whitespace;

/**
 * get html tokens 
 * @return {Array}     []
 */
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
   * @return {Object} [token]
   */
  getNextToken: function(){
    var token = this._getNextToken();
    if (token || token === false) {
      return token;
    }
    var code = this._text.charCodeAt(this.pos);
    // 0x3c is <
    if (code === 0x3c) {
      var nextCode = this._text.charCodeAt(this.pos + 1);
      //all special token start with <!
      token = nextCode === 0x21 ? this.getSpecialToken() : this.getRawToken();
      if (token) {
        return token;
      }
      if (isTagFirstChar(nextCode)) {
        return this.getTagToken();
      }
    }
    return this.getTextToken();
  },
  /**
   * skip white space
   * @return {void} []
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
   * @return {Object} []
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
   * @return {Object} []
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
            //a-z
            if (code >= 0x61 && code <= 0x7a) {
              if (this.options.tag_attrs){
                var tagAttrs = this.getTagAttrs(chr);
                return this.getToken(TOKEN.HTML_TAG_START, tagAttrs.value, {
                  tag: tagAttrs.tag,
                  _tag: tagAttrs._tag,
                  attrs: tagAttrs.attrs
                })
              }else{
                type = TOKEN.HTML_TAG_START;
              }
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
      // 8.1.2.2 in http://www.w3.org/TR/html5/syntax.html
      // may be have whitespace in right
      var tag = ret.slice(2, -1).trim(); 
      return this.getToken(type, ret, {
        tag: tag,
        _tag: tag.toLowerCase()
      });
    }
    return this.getToken(type, ret);
  },
  /**
   * get tag attrs
   * http://www.w3.org/TR/html5/syntax.html
   * @param  {String} tag [tag string]
   * @return {Object}     [tag name & attrs]
   */
  getTagAttrs: function(chr){
    var attrs = [];
    var value = '<' + chr, tag = chr, code;
    var tagEnd = false, parseTag = true, hasEqual = false, spaceBefore = false;
    var tplInstance = this.getTplInstance(true);
    var attrName = '', attrValue = '';
    while(true){
      //parse tag name
      if (parseTag) {
        chr = this.next();
        value += chr;
        code = this._text.charCodeAt(this.pos - 1);
        if (isTagNameChar(code)) {
          tag += chr;
          continue;
        }else{
          // if char is >, break
          if (code === 0x3e) {
            tagEnd = true;
            break;
          }
          parseTag = false;
        }
      }
      var tplToken = this.getTplToken();
      if (tplToken) {
        value += tplToken.value;

        if (tplInstance.hasOutput(tplToken)) {
          if (hasEqual) {
            attrValue += tplToken.value;
          }else{
            attrName += tplToken.value;
          }
        }else{
          if (hasEqual) {
            if (attrValue) {
              attrs.push({name: attrName, value: attrValue}, tplToken);
              attrName = attrValue = '';
            }else{
              attrValue += tplToken.value;
            }
          }else{
            if (attrName) {
              attrs.push({name: attrName});
            }
            tplToken.spaceBefore = spaceBefore;
            attrs.push(tplToken);
            attrName = attrValue = '';
          }
        }
        spaceBefore = false;
        continue;
      }
      chr = this.next();
      if (chr === false) {
        break;
      }
      value += chr;
      code = chr.charCodeAt(0);
      // char is >
      if (code === 0x3e) {
        tagEnd = true;
        break;
      }else if (code === 0x3d) { // char is =
        hasEqual = true;
        spaceBefore = false;
      }else if (!hasEqual && code === 0x2f) { //0x2f is /
        if (this.text.charCodeAt[this.pos - 1] !== 0x2f) {
          if (attrName) {
            attrs.push({name: attrName});
          }
          attrName = attrValue = '';
          hasEqual = false;
        }
      }else if (code === 0x22 || code === 0x27) { // char is ' or "
        if (!hasEqual) {
          this.record();
          this.error('there is no = before quote char', true);
        }
        var quote = this.getQuote(chr);
        value += quote.slice(1);
        attrValue += quote;
        attrs.push({name: attrName, value: attrValue});
        attrName = attrValue = '';
        hasEqual = spaceBefore = false;
      }else if (whitespace[chr]) { // whitespace
        if (hasEqual && attrValue) {
          attrs.push({name: attrName, value: attrValue});
          attrName = attrValue = '';
          hasEqual = spaceBefore = false;
        }else{
          spaceBefore = true;
        }
      }else{
        if (hasEqual) {
          attrValue += chr;
        }else{
          if (spaceBefore && attrName) {
            attrs.push({name: attrName});
            attrName = chr;
          }else{
            attrName += chr;
          }
        }
        spaceBefore = false;
      }
    }
    //add extra attr name or attr value
    if (attrName || attrValue) {
      if (hasEqual) {
        attrs.push({name: attrName, value: attrValue});
      }else{
        attrs.push({name: attrName});
      }
    }
    if (!tagEnd) {
      this.error('can\'t find tag end char >', true);
    }
    //add _name, _value for attr item
    for(var i = 0, length = attrs.length, item; i < length; i++){
      item = attrs[i];
      if (item.ld) {
        attrs[i].tpl = true;
        continue;
      }else if (item.value !== undefined) {
        code = item.value.charCodeAt(0);
        if (code === 0x22 || code === 0x27) {
          attrs[i].quote = item.value.slice(0, 1);
          attrs[i]._value = item.value.slice(1, -1);
        }else{
          attrs[i].quote = '';
          attrs[i]._value = item.value;
        }
      }
      attrs[i]._name = item.name.toLowerCase();
    }
    return {
      value: value,
      tag: tag,
      _tag: tag.toLowerCase(),
      attrs: attrs
    }
  },
  /**
   * skip comment
   * @return {void} []
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
   * get raw element token
   * @return {Object} []
   */
  getRawToken: function(){
    var i = 0, item, pos = 0, code, ret, chr;
    /*jshint -W084 */
    for(;item = rawTokens[i++];){
      if (!this.lookAt(item[0])) {
        continue;
      }
      pos = this.pos + item[0].length;
      code = this._text.charCodeAt(pos);
      //next char is not space or >
      if (code !== 0x20 && code !== 0x3e) {
        continue;
      }
      ret = this.getMatched(item[0], item[1]);
      if (!ret) {
        continue;
      }
      //read until char is >
      /*jshint -W084 */
      for(;chr = this.next();){
        ret += chr;
        if (chr.charCodeAt(0) === 0x3e) {
          break;
        }
      }
      return this.getToken(item[2], ret);
    }
    return false;
  },
  /**
   * get special token
   * @return {Object} []
   */
  getSpecialToken: function(){
    var pos, npos, findItem, j, length, ret, i = 0, item;
    /*jshint -W084 */
    for(;item = specialTokens[i++];){
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