'use strict';

var think = require('thinkjs-util');
var error = require('./error.js');

module.exports = think.Class({
  /**
   * text
   * @type {String}
   */
  text: '',
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
   * template syntax, like: smarty, php
   * @type {String}
   */
  tpl: '',
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
  }
})