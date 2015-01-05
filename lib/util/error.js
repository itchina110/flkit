'use strict';
var think = require('thinkjs-util');

/**
 * error class
 */
module.exports = think.Class({
  /**
   * init
   * @param  {String} message [error message]
   * @param  {Number} line    [error line]
   * @param  {Number} col     [error col]
   * @return {Object}         []
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