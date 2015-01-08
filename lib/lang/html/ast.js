'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');
var lexer = require('./lexer.js');
var config = require('./config.js');


//var MODE = config.insertionMode;

module.exports = think.Class(base, {
  /**
   * token list
   * @type {Array}
   */
  tokens: [],
  /**
   * stack of open elements
   * @type {Array}
   */
  openElements: [],
  /**
   * run
   * @param  {Object} options []
   * @return {Array}          []
   */
  run: function(options){
    this.super('init', options);
    if (this.hasTpl) {
      this.error('ast can\'t support template syntax');
    }
    var instance = this.getInstance(lexer, true);
    this.tokens = instance.run({
      tag_attrs: true
    });
    this.parse();
  },
  parse: function(){
    
  }
})