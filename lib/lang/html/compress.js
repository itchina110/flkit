'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');
var TOKEN = require('../../util/token.js');
var lexer = require('./lexer.js');
var config = require('./config.js');
var cssCompress = require('../css/compress.js');
var jsCompress = require('../js/compress.js');

var optionalEndTags = config.optionalEndTags;
var voidElements = config.voidElements;
var optionalAttrValue = config.optionalAttrValue;
var allOptionalAttrValue = optionalAttrValue['*'];
var emptyAttribute = config.emptyAttribute;
var safeTag = config.safeTag;
var blockTag = config.blockTag;
var safeAttrValueReg = config.safeAttrValueReg;

module.exports = think.Class(base, {
  /**
   * compress options
   * @type {Object}
   */
  options: {
    remove_comment: true,
    simple_doctype: true,
    simple_charset: true,
    remove_http_xmlns: true,
    remove_empty_script: false,
    remove_empty_style: false,
    remove_optional_attrs: true,
    remove_attrs_quote: true,
    remove_attrs_optional_value: true,
    remove_http_protocal: false,
    remove_https_protocal: false,
    remove_optional_endtag: true,
    remove_space_in_block_tag: true,
    keep_endtag_list: [],
    compress_style_value: true,
    compress_inline_css: true,
    compress_inline_js: true,
    compress_js_tpl: false,
    js_tpl_options: {},
    merge_adjacent_inline_css: false,
    merge_adjacent_inline_js: false
  },
  /**
   * text tokens
   * @type {Array}
   */
  tokens: [],
  /**
   * current token
   * @type {Object}
   */
  token: null,
  /**
   * prev token
   * @type {Object}
   */
  prevToken: null,
  /**
   * next token
   * @type {Object}
   */
  nextToken: null,
  /**
   * parent element list
   * @type {Array}
   */
  parents: [],
  /**
   * parent element
   * @type {Object}
   */
  parent: null,
  /**
   * get token
   * @return {Object} []
   */
  getToken: function(){
    if (!this.token) {
      this.token = this.tokens[0];
    }else{
      if (!this.nextToken) {
        return null;
      }
      this.prevToken = this.token;
      this.token = this.nextToken;
    }
    var prevToken = this.prevToken;
    if (prevToken) {
      var prevTag = prevToken._tag;
      if (prevToken.type === TOKEN.HTML_TAG_START && !voidElements[prevTag]) {
        this.parents.push(this.prevToken);
      }
      if (this.token.type === TOKEN.HTML_TAG_END && this.parents.length) {
        var plast = this.parents[this.parents.length - 1];
        if (plast._tag === this.token._tag) {
          this.parents.pop();
        }
      }
      if (this.parents.length) {
        this.parent = this.parents[this.parents.length - 1];
      }else{
        this.parent = null;
      }
    }
    this.nextToken = null;
    var next;
    while(this.index < this.length - 1){
      next = this.tokens[++this.index];
      if (next.type === TOKEN.ILLEGAL) {
        continue;
      }
      this.nextToken = next;
      break;
    }
    return this.token;
  },
  /**
   * compress doc type
   * @param  {Object} token []
   * @return {String}       []
   */
  compressDocType: function(token){
    if (this.options.simple_doctype) {
      return '<!DOCTYPE html>';
    }
    return token.value;
  },
  /**
   * compress charset 
   * @param  {Object} token []
   * @return {String}       []
   */
  compressCharset: function(token){
    if (!this.options.simple_charset || token._tag !== 'meta') {
      return false;
    }
    var attrs = token.attrs, item, i = 0, is = false, charset;
    /*jshint -W084 */
    for(;item = attrs[i++];){
      if (item._name === 'http-equiv' && item._value && item._value.toLowerCase() === 'content-type') {
        is = true;
      }
      if (item._name === 'content') {
        charset = item._value;
        if (is) {
          break;
        }
      }
    }
    if (is && charset) {
      charset = charset.split('=')[1];
      return '<meta charset=' + charset + '>';
    }
    return false;
  },
  /**
   * compress inline js
   * @param  {Object} token []
   * @return {String}       []
   */
  compressInlineJs: function(token){
    var startToken = token.start, contentToken = token.content, instance;
    var start = this.compressStartTag(startToken), end = '</script>', content = contentToken.value;
    //if script is external link, return it
    if (startToken.isExternal) {
      return start + content + end;
    }
    var options = this.options, isScript = startToken.isScript;
    var callback = options.compress_inline_js, tplCallback = options.compress_js_tpl;
    if (content.trim()) {
      if (isScript && callback) {
        if (think.isFunction(callback)) {
          content = callback(content, contentToken, this);
        }else{
          instance = this.getInstance(jsCompress, content);
          instance.line = contentToken.line;
          instance.col = contentToken.col;
          content = instance.run();
        }
      }else if (startToken.isTpl && tplCallback) {
        if (think.isFunction(tplCallback)) {
          content = tplCallback(content, contentToken, this);
        }else{
          instance = this.getInstance(this.constructor, content, options.js_tpl_options);
          instance.line = contentToken.line;
          instance.col = contentToken.col;
          content = instance.run();
        }
      }
    }
    //remove empty script
    if (isScript && options.remove_empty_script && !content.trim()) {
      return '';
    }
    return start + content + end;
  },
  /**
   * compress inline css
   * @param  {Object} token []
   * @return {String}       []
   */
  compressInlineCss: function(token){
    var startToken = token.start, contentToken = token.content;
    var start = this.compressStartTag(startToken), end = '</style>', content = contentToken.value;
    var options = this.options, callback = options.compress_inline_css;
    //remove empty style
    if (!content.trim()) {
      return options.remove_empty_style ? '' : (start + content + end);
    }
    if (!startToken.isStyle || !callback) {
      return start + content + end;
    }
    if (think.isFunction(callback)) {
      content = callback(content, contentToken, this)
    }else{
      var instance = this.getInstance(cssCompress, content, {
        line: contentToken.line,
        col: contentToken.col
      });
      content = instance.run();
    }
    if (!content && options.remove_empty_style) {
      return '';
    }
    return start + content + end;
  },
  /**
   * compress tag style value
   * @param  {String} value []
   * @return {String}       []
   */
  compressStyle: function(value, token){
    value = value.trim();
    if (!value) {
      return value;
    }
    var callback = this.options.compress_style_value;
    if (!callback) {
      return value;
    }
    if (think.isFunction(callback)) {
      return callback(value, token, this);
    }
    var instance = this.getInstance(cssCompress, 'a{' + value + '}', {
      line: token.line,
      col: token.col
    });
    value = instance.run();
    return value.slice(2, -1);
  },
  /**
   * compress start tag
   * @param  {Object} token []
   * @return {String}       []
   */
  compressStartTag: function(token){
    var text = this.compressCharset(token);
    if (text) {
      return text;
    }
    if (token.attrs.length === 0) {
      return '<' + token._tag + '>';
    }
    var tag = token._tag, attrs = token.attrs, i = 0, item, hasTpl = false, names = {}, name, value, _value;
    var tagOptionalAttrs = optionalAttrValue[tag] || {}, options = this.options, optAttrs = [];
    /*jshint -W084 */
    for(;item = attrs[i++];){
      // template syntax
      if (item.tpl) { 
        hasTpl = true;
        optAttrs.push(item);
        continue;
      }
      name = item._name;
      // if not have template syntax, and name is exist, ignore it
      if (!hasTpl && names[name]) {
        continue;
      }
      names[name] = true;
      value = item._value;
      // remove optional attrs
      // <form method="GET"> => <form>
      if (options.remove_optional_attrs) {
        var v = (value || '').toLowerCase();
        if (name in tagOptionalAttrs && tagOptionalAttrs[name] === v) {
          continue;
        }else if (name in allOptionalAttrValue && allOptionalAttrValue[name] === v) {
          continue;
        }
      }
      // if value is undefined, only push name
      if (value === undefined) {
        optAttrs.push(item.name);
        continue;
      }
      // remove optional attr value
      // disabled="disabled" => disabled
      if (options.remove_attrs_optional_value && emptyAttribute[name]) {
        optAttrs.push(item.name);
        continue;
      }
      // remove http or https protocal
      else if (name === 'href' || name === 'src') {
        _value = value.toLowerCase();
        if (options.remove_http_protocal && _value.indexOf('http://') === 0) {
          value = value.slice(5);
        }
        if (options.remove_https_protocal && _value.indexOf('https://') === 0) {
          value = value.slice(6);
        }
      }
      // compress style value
      else if (name === 'style' && !this.containTpl(value)) {
        value = this.compressStyle(value, token);
        //compressed value is empty, remove style attribute
        if (!value) {
          continue;
        }
      }
      // remove html xmlns
      else if (tag === 'html' && name === 'xmlns') {
        if (options.remove_http_xmlns) {
          continue;
        }
      }
      // remove class value ext space
      else if (name === 'class' && !this.containTpl(value)) {
        value = value.split(/\s+/).join(' ');
      }
      // remove last ; on event attribute value
      else if (name.indexOf('on') === 0) {
        value = value.trim();
        while(value.charCodeAt(value.length - 1) === 0x3b) {
          value = value.slice(0, -1);
        }
      }
      //remove quote
      if (options.remove_attrs_quote && item.quote && safeAttrValueReg.test(value)) {
        item.quote = '';
      }
      item._value = value;
      item.value = item.quote + value + item.quote;
      optAttrs.push(item);
    }
    var length = optAttrs.length, attrStr = '', nextNeedSpaceBefore = false;
    if (length === 0) {
      return '<' + tag + '>';
    }
    /*jshint -W084 */
    for(i = 0; item = optAttrs[i++];){
      if (nextNeedSpaceBefore) {
        attrStr += ' ';
      }
      if (item.tpl) {
        if (item.spaceBefore && !nextNeedSpaceBefore) {
          attrStr += ' ';
        }
        attrStr += item.value;
      }else if (think.isString(item)) {
        attrStr += item;
        nextNeedSpaceBefore = true;
      }else{
        if (item.quote) {
          attrStr += item._name + '=' + item.quote + item._value + item.quote;
          nextNeedSpaceBefore = false;
        }else{
          attrStr += item._name + '=' + item._value;
          nextNeedSpaceBefore = true;
        }
      }
    }
    attrStr = attrStr.trim();
    return '<' + tag + ' ' + attrStr + '>';
  },
  /**
   * compress end tag
   * @param  {Object} token []
   * @return {String}       []
   */
  compressEndTag: function(token){
    var value = '</' + token._tag + '>', options = this.options;
    if (!options.remove_optional_endtag) {
      return value;
    }
    var tag = token._tag;
    if (options.keep_endtag_list.indexOf(tag) > -1) {
      return value;
    }
    if (!(tag in optionalEndTags)) {
      return value;
    }
    var where = optionalEndTags[tag], nextToken = this.nextToken;
    // next token has comment
    if (where.next_comment === false) {
      if (nextToken && nextToken.commentBefore.length && !options.remove_comment) {
        return value;
      }
    }
    // next token has space
    if (where.next_space === false) {
      if (this.spaceBeforeNextToken) {
        return value;
      }
      if (nextToken && nextToken.type === TOKEN.HTML_TEXT && /^\s+/.test(nextToken.value)) {
        return value;
      }
    }
    // parent not
    var not = where.parent_not, parent = this.parent;
    if (not && parent) {
      if (not.indexOf(parent._tag) > -1) {
        return value;
      }
    }
    if (!nextToken) {
      return value;
    }
    //next element
    if (where.next_element && where.next_element.indexOf(nextToken._tag) > -1) {
      return '';
    }
    //next parent
    if (where.next_parent && parent && nextToken._tag === parent._tag) {
      return '';
    }
    return value;
  },
  /**
   * compress common
   * @param  {Object} token []
   * @return {String}       []
   */
  compressCommon: function(token){
    var ret = '', options = this.options;
    // not remove comment
    if (!options.remove_comment) {
      var comments = token.commentBefore;
      for(var i = 0, length = comments.length; i < length; i++){
        ret += comments[i].value;
      }
    }
    if (this.lastHasSpace || !this.token.spaceBefore) {
      return ret;
    }
    var type = token.type;
    if (type === TOKEN.HTML_DOCTYPE || 
        type === TOKEN.HTML_TEXT || 
        type === TOKEN.IE_HACK || 
        type === TOKEN.HTML_TAG_SCRIPT || 
        type === TOKEN.HTML_TAG_STYLE || 
        type === TOKEN.TPL) {
      return ret;
    }
    //safe tag
    if (type === TOKEN.HTML_TAG_END || type === TOKEN.HTML_TAG_START) {
      if (token._tag in safeTag) {
        return ret;
      }
    }
    var prev = this.prevToken;
    if (prev) {
      var prevType = this.prevToken.type;
      if (prevType === TOKEN.HTML_TAG_SCRIPT || prevType === TOKEN.HTML_TAG_STYLE) {
        return ret;
      }
      if (options.remove_space_in_block_tag) {
        // www </div> => www</div>
        if (token._tag in blockTag && prevType === TOKEN.HTML_TEXT) {
          return ret;
        }
        // remove space between 2 block end tags
        // </div> </div> => </div></div>
        if (prevType === TOKEN.HTML_TAG_END && type === TOKEN.HTML_TAG_END) {
          if (prev._tag in blockTag && token._tag in blockTag) {
            return ret;
          }
        }
        // www <div> => www<div>
        else if (type === TOKEN.HTML_TAG_START && token._tag in blockTag) {
          return ret;
        }
      }
    }
    ret += ' ';
    return ret;
  },
  /**
   * compress text token
   * @param  {Object} token []
   * @return {String}       []
   */
  compressText: function(token){
    var value = token.value, space = token.spaceBefore ? ' ' : '';
    // async api may have line comment, can't compress it
    if (value.indexOf('//') > -1) {
      return space + value;
    }
    value = value.replace(/\s+/g, ' ');
    var prev = this.prevToken, options = this.options;
    //if prev token is block tag, trim it
    if (prev && (prev.type === TOKEN.HTML_TAG_START || prev.type === TOKEN.HTML_TAG_END)) {
      if (options.remove_space_in_block_tag && blockTag[prev._tag]) {
        return value;
      }
    }
    value = space + value;
    return value;
  },
  /**
   * compress token
   * @return {void} [description]
   */
  compress: function(){
    var token, text, output = '';
    /*jshint -W084 */
    for(;token = this.getToken();){
      text = this.compressCommon(token);
      switch(token.type){
        case TOKEN.HTML_TEXT:
          text += this.compressText(token);
          break;
        case TOKEN.HTML_DOCTYPE:
          text += this.compressDocType(token);
          break;
        case TOKEN.HTML_TAG_END:
          text += this.compressEndTag(token);
          break;
        case TOKEN.HTML_TAG_START:
          text += this.compressStartTag(token);
          break;
        case TOKEN.HTML_TAG_SCRIPT:
          text += this.compressInlineJs(token);
          break;
        case TOKEN.HTML_TAG_STYLE:
          text += this.compressInlineCss(token);
          break;
        case TOKEN.ILLEGAL:
          break;
        default:
          text += token.value;
          break;
      }
      if (text) {
        this.lastHasSpace = text.charCodeAt(text.length - 1) === 0x20;
      }
      output += text;
    }
    return output;
  },
  /**
   * run
   * @param  {Object} options []
   * @return {String}         []
   */
  run: function(options){
    this._run(options);
    var instance = this.getInstance(lexer, true);
    this.tokens = instance.run({
      tag_attrs: true
    });
    this.index = 0;
    this.length = this.tokens.length;
    //don't compress xml text
    if (instance.isXML) {
      return this.text;
    }
    return this.compress();
  }
})