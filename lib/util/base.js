'use strict';

var path = require('path');

var think = require('thinkjs-util');
var error = require('./error.js');

var isArray = think.isArray;
/**
 * templates list
 * @type {Object}
 */
var templates = {};

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
   * @param  {String} text  [source text]
   * @return {void}      
   */
  init: function(text){
    this.text = this.clean(text);
    this.length = this.text.length;
    /* jshint ignore:start */
    this._init && this._init();
    /* jshint ignore:end */
    //lower text
    if (!this._text) {
      this._text = this.text.toLowerCase().replace(/\s/g, ' ');
    }
  },
  /**
   * remove unnecessary chars in text
   * @param  {String} text [source text]
   * @return {String}      [cleaned text]
   */
  clean: function(text){
    //\uFEFF is BOM char
    return text.replace(/\r\n?|[\n\u2028\u2029]/g, '\n').replace(/\uFEFF/g, '');
  },
  /**
   * throw new error
   * @param  {String} message []
   * @param  {Number} line    []
   * @param  {Number} col     []
   * @return {}         []
   */
  error: function(message, line, col){
    throw new error(message, line, col);
  },
  /**
   * init delimiter
   * @return {void} []
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
   * @param  {String} text [source text]
   * @return {Boolean}       []
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
   * get token instance
   * @param  {String} text []
   * @return {Object}      []
   */
  getInstance: function(cls, text, extra){
    if (typeof cls === 'string') {
      var file = path.normalize(__dirname + '/../lang/' + cls.replace('_', '/') + '.js');
      cls = require(file);
    }
    if (text === true) {
      text = '';
      extra = true;
    }
    var instance = cls(text || this.text);
    instance.tpl = this.tpl;
    instance.ld = this.ld;
    instance.rd = this.rd;
    if (extra === true) {
      //read line & col from this constructor
      instance.line = this.line || 0;
      instance.col = this.col || 0;
    }else if (think.isObject(extra)) {
      for(var key in extra){
        instance[key] = extra[key];
      }
    }
    return instance;
  },
  /**
   * get template class instance
   * @return {Object} []
   */
  getTplInstance: function(ignoreError){
    if (templates[this.tpl]) {
      return templates[this.tpl];
    }
    var file = path.normalize(__dirname + '/../template/' + this.tpl + '.js');
    if (think.isFile(file)) {
      return require(file);
    }else if (!ignoreError){
      this.error(this.tpl + ' template is not support');
    }
  },
  /**
   * add template support
   * @param {String} tpl []
   * @param {Object} cls []
   */
  addTpl: function(tpl, cls){
    templates[tpl] = cls;
  },
  /**
   * run
   * @return {void} [abstract run method]
   */
  run: function(options){
    this.options = think.extend(this.options, options);
    this.initDelimiter();
    this.hasTpl = this.containTpl(this.text);
  }
})