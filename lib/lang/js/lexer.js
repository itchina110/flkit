'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');

//var TOKEN = require('../../util/token.js');

module.exports = think.Class(base, {
  /**
   * run
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  run: function(options){
    this.super('init', options);
  }
})