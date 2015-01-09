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
    if (token.ld === '<?=' || token._value.indexOf('echo ') > -1) {
      return true;
    }
    return false;
  },
  /**
   * check text has template syntax
   * php can omit right delimiter ?>
   * @param  {String} ld   []
   * @param  {String} rd   []
   * @param  {String} text []
   * @return {Boolean}     []
   */
  containTpl: function(ld, rd, text){
    return text.indexOf(ld) > -1;
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