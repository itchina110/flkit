'use strict';

var think = require('thinkjs-util');
var base = require('../../util/base.js');

module.exports = think.Class(base, {
  /**
   * run
   * @param  {Object} options [compress options]
   * @return {String}         [compressed text]
   */
  run: function(options){
    this.super('run', options);
    return this.text;
  }
})