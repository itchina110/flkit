'use strict';

var path = require('path');
var sys = require('util');
var think = require('thinkjs-util');
var error = require('./error.js');
var Message = require('./message.js');


var isArray = think.isArray;
var templates = {};
var tplInstances = {};


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
      this._text = this.text.toLowerCase();
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
   * @return {}               []
   */
  error: function(message, line, col, data){
    if (isArray(line)) {
      data = line;
      line = undefined;
    }
    if (line === undefined && this.line !== undefined) {
      line = this.line;
      col = this.col;
    }
    if (isArray(data)) {
      message = sys.format.call(null, data.unshift(message));
    }
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
    //filter empty delimiter
    this.ld = this.ld.filter(function(item){
      return item;
    })
    this.rd = this.rd.filter(function(item){
      return item;
    })
    if (this.ld.length !== this.rd.length) {
      throw new Error(Message.DelimiterNotEqual);
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
    var tplInstance = this.getTplInstance();
    for(var i = 0, length = this.ld.length, ld, rd; i < length; i++){
      ld = this.ld[i];
      rd = this.rd[i];
      if (tplInstance.containTpl(ld, rd, text)) {
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
  getTplInstance: function(){
    if (!this.tpl) {
      return;
    }
    if (tplInstances[this.tpl]) {
      return tplInstances[this.tpl];
    }
    var instance;
    if (templates[this.tpl]) {
      instance = templates[this.tpl]();
    }else{
      var file = path.normalize(__dirname + '/../template/' + this.tpl + '.js');
      if (think.isFile(file)) {
        instance = require(file)();
      }else{
        this.error(Message.TplNotFound, [this.tpl]);
      }
    }
    tplInstances[this.tpl] = instance;
    return instance;
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
  _run: function(options){
    this.options = think.extend(this.options, options);
    this.tpl = this.tpl.toLowerCase();
    this.initDelimiter();
    this.hasTpl = this.containTpl(this.text);
  },
  run: function(){
    
  }
})