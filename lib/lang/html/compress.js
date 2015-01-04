'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');
var TOKEN = require('../../util/token.js');
var lexer = require('./lexer.js');
var config = require('./config.js');

var optionalEndTags = config.optionalEndTags;

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
      this.token = this.nextToken;
    }
    if (this.prevToken) {
      if (!this.parent && this.prevToken.type === TOKEN.HTML_TAG_START) {
        this.parent = this.prevToken;
      }else if (this.prevToken.type === TOKEN.HTML_TAG_END && this.parent && this.parent._tag === this.prevToken._tag) {
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
    return token.value;
  },
  /**
   * compress start tag
   * @param  {Object} token []
   * @return {String}       []
   */
  compressStartTag: function(token){
    return token.value;
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
    if (where.next && where.next.indexOf(next._tag) > -1) {
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
      console.log((this.parent || '').value, token.value);
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