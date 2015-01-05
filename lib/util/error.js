'use strict';
var think = require('thinkjs-util');

/**
 * error class
 * @param  {[type]} message   [description]
 * @param  {[type]} line      [description]
 * @param  {[type]} col       [description]
 * @param  {[type]} pos                               
 * @return {[type]}           [description]
 */
module.exports = think.Class({
  /**
   * init
   * @param  {String} message [description]
   * @param  {Number} line    [description]
   * @param  {Number} col     [description]
   * @param  {Number} pos     [description]
   * @return {Object}         [description]
   */
  init: function(message, line, col){
    this.message = message;
    if (line !== undefined) {
      this.line = line + 1;
      this.col = col + 1;
    }
    this.stack = new Error(this.toString()).stack;
  },
  /**
   * toString
   * @return {String} get error string
   */
  toString: function(){
    if (this.line !== undefined) {
      return this.message + ' (line: ' + this.line + ', col: ' + this.col + ')' + '\n';
    }
    return this.message + '\n';
  }
})