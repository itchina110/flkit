'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');

module.exports = think.Class(base, {
  /**
   * check template syntax has output
   * @param  {String}  tpl []
   * @return {Boolean}     []
   */
  hasOutput: function(token){
    var code = token._value.trim().charCodeAt(0);
    return code === 0x24;
  },
  /**
   * get matched smarty string
   * @param  {String} start []
   * @param  {String} end   []
   * @param  {Object} lexer []
   * @return {String}       []
   */
  getMatched: function(start, end, lexer){
    return this._getMatched(start, end, lexer, {
      nest: true
    })
  }
})