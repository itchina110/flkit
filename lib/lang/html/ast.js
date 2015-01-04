'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');
var lexer = require('./lexer.js');

module.exports = think.Class(base, {
  /**
   * token list
   * @type {Array}
   */
  tokens: [],
  /**
   * get text tokens
   * @return {Array} [text tokens]
   */
  getTokens: function(){
    var instance = this.getInstance(lexer);
    return instance.run({
      tag_attrs: true
    });
  },
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
    this.tokens = this.getTokens();

  }
})