'use strict';

var think = require('thinkjs-util');
var error = require('./error.js');

var isArray = think.isArray;

module.exports = think.Class({
  /**
   * text
   * @type {String}
   */
  text: '',
  /**
   * template syntax, like: smarty, php
   * @type {String}
   */
  tpl: '',
  /**
   * left delimiter
   * allow multi
   * @type array
   */
  ld: [],
  /**
   * right delimiter
   * allow multi, nums must be equal ld length
   * @type array
   */
  rd: [],
  /**
   * text encoding
   * @type {String}
   */
  encoding: 'utf8',
  /**
   * text length
   * @type {Number}
   */
  length: 0,
  /**
   * check has template syntax in text
   * @type {Boolean}
   */
  hasTpl: false,
  /**
   * options
   * @type {Object}
   */
  options: {},
  /**
   * init constructor
   * @param  {[type]} text [description]
   * @return {[type]}      [description]
   */
  init: function(text, encoding){
    if (encoding) {
      this.encoding = encoding;
    }
    this.text = this.trim(text);
    this.length = this.text.length;
    this._init && this._init();
    if (!this._text) {
      this._text = this.text.toLowerCase();
    }
  },
  /**
   * remove unnecessary chars in text
   * @param  {[type]} text [description]
   * @return {[type]}      [description]
   */
  trim: function(text){
    return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\uFEFF/g, '');
  },
  /**
   * throw new error
   * @param  {String} message [description]
   * @param  {Number} line    [description]
   * @param  {Number} col     [description]
   * @param  {Number} pos     [description]
   * @return {}         [description]
   */
  error: function(message, line, col, pos){
    throw new error(message, line, col, pos);
  },
  /**
   * init delimiter
   * @return {[type]} [description]
   */
  initDelimiter: function(){
    if (!isArray(this.ld)) {
      this.ld = [this.ld];
      this.rd = [this.rd];
    }
    if (this.ld.length !== this.rd.length) {
      throw new Error('ld & rd length not equaled');
    }
  },
  /**
   * check text has template syntax
   * @param  {String} text [description]
   * @return {Boolean}       [description]
   */
  containTpl: function(text){
    if (!this.tpl || !this.ld.length) {
      return false;
    }
    for(var i = 0, length = this.ld.length, ld, rd; i < length; i++){
      ld = this.ld[i];
      rd = this.rd[i];
      if (text.indexOf(ld) > -1 && text.indexOf(rd) > -1) {
        return true;
      }
    }
    return false;
  },
  /**
   * run
   * @return {[type]} [description]
   */
  run: function(options){
    this.options = think.extend(this.options, options);
    this.initDelimiter();
    this.hasTpl = this.containTpl(this.text);
  }
})