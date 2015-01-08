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
    if (token.ld === '<?=' || token._value.indexOf('echo ')) {
      return true;
    }
  },
  /**
   * get matched php string
   * @param  {[type]} start []
   * @param  {[type]} end   []
   * @param  {[type]} lexer []
   * @return {[type]}       []
   */
  getMatched: function(start, end, lexer){
    return this._getMatched(start, end, lexer, {
      ignoreEnd: true,
      quote: true,
      multi_comment: true
    })
  }
})