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
    keep_endtag_list: [],
    compress_style_value: true,
    compress_inline_css: true,
    compress_inline_js: true,
    compress_js_tpl: false,
    merge_adjacent_css: false,
    merge_adjacent_js: false
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
   * space before next token
   * @type {String}
   */
  spaceBeforeNextToken: false,
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
   * output text
   * @type {String}
   */
  output: '',
  /**
   * get token
   * @return {Object} []
   */
  getToken: function(){
    if (!this.token) {
      this.token = this.tokens[this.index];
    }else{
      this.prevToken = this.token;
      if (!this.nextToken) {
        return null;
      }
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
    this.spaceBeforeNextToken = false;
    while(true){
      var next = this.tokens[++this.index];
      if (!next) {
        break;
      }
      if (next.type !== TOKEN.HTML_TEXT || !/^\s+$/.test(next.value)) {
        this.nextToken = next;
        break;
      }
      this.spaceBeforeNextToken = true;
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
    var attrs = token.attrs, item, i = 0, charset;
    /*jshint -W084 */
    for(;item = attrs[i++];){
      if (item._name === 'charset') {
        charset = item._value;
        break;
      }
    }
    if (charset) {
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
    var callback = this.options.compress_inline_js;
    if (!callback) {
      return token.value;
    }
    var value = token.value;
    if (think.isFunction(callback)) {
      return callback(value, this);
    }
    var instance = this.getInstance(jsCompress, value);
    value = instance.run();
    return value;
  },
  /**
   * compress inline css
   * @param  {Object} token []
   * @return {String}       []
   */
  compressInlineCss: function(token){
    var callback = this.options.compress_inline_css;
    if (!callback) {
      return token.value;
    }
    var value = token.value;
    if (think.isFunction(callback)) {
      return callback(value, this);
    }
    var instance = this.getInstance(cssCompress, value);
    value = instance.run();
    return value;
  },
  /**
   * compress tag style value
   * @param  {String} value []
   * @return {String}       []
   */
  compressStyle: function(value){
    value = value.trim();
    if (!value) {
      return value;
    }
    var callback = this.options.compress_style_value;
    if (!callback) {
      return value;
    }
    if (think.isFunction(callback)) {
      return callback(value, this);
    }
    var instance = this.getInstance(cssCompress, 'a{' + value + '}');
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
        optAttrs.push(item.value);
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
        value = this.compressStyle(value);
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
      if (options.remove_attrs_quote && item.quote && /^[\w\/\:\-\.\?\&\=]+$/.test(value)) {
        item.quote = '';
      }
      item._value = value;
      item.value = item.quote + value + item.quote;
      optAttrs.push(item);
    }
    var length = optAttrs.length, attrStr = '', nextNeedSpace = false;
    if (length === 0) {
      return '<' + tag + '>';
    }
    /*jshint -W084 */
    for(i = 0; item = optAttrs[i++];){
      if (nextNeedSpace) {
        attrStr += ' ';
      }
      if (item.tpl) {
        if (item.spaceBefore && !nextNeedSpace) {
          attrStr += ' ';
        }
        attrStr += item.value;
      }else if (think.isString(item)) {
        attrStr += item;
        nextNeedSpace = true;
      }else{
        if (item.quote) {
          attrStr += item._name + '=' + item.quote + item._value + item.quote;
          nextNeedSpace = false;
        }else{
          attrStr += item._name + '=' + item._value;
          nextNeedSpace = true;
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
    if (!this.options.remove_optional_endtag) {
      return token.value;
    }
    var tag = token._tag;
    if (this.options.keep_endtag_list.indexOf(tag) > -1) {
      return token.value;
    }
    if (!(tag in optionalEndTags)) {
      return token.value;
    }
    var where = optionalEndTags[tag];
    // next token has comment
    if (where.next_comment === false) {
      if (this.nextToken && this.nextToken.comments.length && !this.options.remove_comment) {
        return token.value;
      }
    }
    // next token has space
    if (where.next_space === false) {
      if (this.spaceBeforeNextToken) {
        return token.value;
      }
      if (this.nextToken && this.nextToken.type === TOKEN.HTML_TEXT && /^\s+/.test(this.nextToken.value)) {
        return token.value;
      }
    }
    // parent not
    if (where.parent_not && this.parent) {
      var not = where.parent_not;
      var parentTag = this.parent._tag;
      if (not.indexOf(parentTag) > -1) {
        return token.value;
      }
    }
    if (!this.nextToken) {
      return token.value;
    }
    var next = this.nextToken;
    if (where.next_element && where.next_element.indexOf(next._tag) > -1) {
      return '';
    }
    if (where.next_parent && this.parent && next._tag === this.parent._tag) {
      return '';
    }
    return token.value;
  },
  /**
   * compress comment
   * @param  {Object} token []
   * @return {String}       []
   */
  compressComment: function(token){
    if (this.options.remove_comment) {
      return '';
    }
    var comments = token.comments;
    var ret = '';
    for(var i = 0, length = comments.length; i < length; i++){
      ret += comments[i].value;
    }
    return ret;
  },
  /**
   * compress text token
   * @param  {Object} token []
   * @return {String}       []
   */
  compressText: function(token){
    var value = token.value;
    // async api may have line comment, can't compress it
    if (value.indexOf('//') > -1) {
      return value;
    }
    if (token.newlines) {
      value = ' ' + value;
    }
    value = value.replace(/^\s+/, ' ').replace(/\s+$/, ' ');
    return value;
  },
  /**
   * compress token
   * @return {void} [description]
   */
  compress: function(){
    var token;
    /*jshint -W084 */
    for(;token = this.getToken();){
      this.output += this.compressComment(token);
      switch(token.type){
        case TOKEN.HTML_TEXT:
          this.output += this.compressText(token);
          break;
        case TOKEN.HTML_DOCTYPE:
          this.output += this.compressDocType(token);
          break;
        case TOKEN.HTML_TAG_END:
          this.output += this.compressEndTag(token);
          break;
        case TOKEN.HTML_TAG_START:
          this.output += this.compressStartTag(token);
          break;
        default:
          this.output += token.value;
      }
    }
  },
  /**
   * run
   * @param  {Object} options []
   * @return {String}         []
   */
  run: function(options){
    this.super('run', options);
    var instance = this.getInstance(lexer);
    this.tokens = instance.run({
      tag_attrs: true
    });
    this.index = 0;
    //don't compress xml text
    if (instance.isXML) {
      return this.text;
    }
    this.compress();
    return this.output;
  }
})