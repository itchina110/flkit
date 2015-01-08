'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');

module.exports = think.Class(base, {
  /**
   * check template syntax has output
   * @param  {String}  tpl [description]
   * @return {Boolean}     [description]
   */
  hasOutput: function(tplToken){
    var code = tplToken._value.trim().charCodeAt(0);
    return code === 0x24;
  },
  /**
   * [getMatched description]
   * @param  {[type]} start [description]
   * @param  {[type]} end   [description]
   * @param  {[type]} lexer [description]
   * @return {[type]}       [description]
   */
  getMatched: function(start, end, lexer){
    return this._getMatched(start, end, lexer, {
      quote: true,
      multi_comment: true
    })
  }
})