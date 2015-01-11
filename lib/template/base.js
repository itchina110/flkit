'use strict';

var think = require('thinkjs-util');

/**
 * template base class
 * @type {Object}
 */
module.exports = think.Class({
  /**
   * check tpl token has output
   * @param  {Object}  token []
   * @return {Boolean}       []
   */
  hasOutput: function(){
    return false;
  },
  /**
   * check text has template syntax
   * @param  {String} ld    []
   * @param  {String} rd    []
   * @param  {String} text []
   * @return {Boolean}       []
   */
  containTpl: function(ld, rd, text){
    return text.indexOf(ld) > -1 && text.indexOf(rd) > -1;
  },
  /**
   * get tpl matched
   * @param  {Object} lexer []
   * @return {Object}       []
   */
  _getMatched: function(start, end, lexer, options){
    if (!lexer.lookAt(start)) {
      return false;
    }
    lexer.record();
    var startLength = start.length, endLength = end.length;
    var pos = lexer.find(end, startLength), ret = '';
    options = options || {};
    //can't find end string in text
    if (pos === -1) {
      //can ignore end chars, etc: php can ignore ?>
      if (options.ignoreEnd) {
        ret = lexer.text.slice(lexer.pos);
        lexer.pos = lexer.length;
        return ret;
      }
      return false;
    }
    ret = lexer.forward(startLength);
    var nums = 0, chr, code, nextCode;
    var nest = options.nest, quote = options.quote, escape = false;
    var multi_comment = options.multi_comment;
    var line_comment = options.line_comment, comment;
    /*jshint -W084 */
    for(;chr = lexer.text[lexer.pos];){
      code = chr.charCodeAt(0);
      if (lexer.lookAt(end)) {
        ret += lexer.forward(endLength);
        if (!nest || nums === 0) {
          return ret;
        }
        nums--;
        continue;
      }else if(nest && lexer.lookAt(start)){
        ret += lexer.forward(startLength);
        nums++;
        continue;
      }
      code = lexer.text.charCodeAt(lexer.pos);
      //quote char
      if (quote) {
        if (code === 0x5c || escape) {
          escape = !escape;
          ret += lexer.next();
          continue;
        }else if (!escape && (code === 0x22 || code === 0x27)) {
          ret += lexer.getQuote({
            rollback: true
          }).value;
          continue;
        }
      }
      //comment
      if (code === 0x2f) { // /
        nextCode = lexer.text.charCodeAt(lexer.pos + 1);
        comment = '';
        if (multi_comment && nextCode === 0x2a) {
          comment = lexer.getCommentToken(1, 0, false);
        }else if (line_comment && nextCode === 0x2f) {
          comment = lexer.getCommentToken(0, 1, false);
        }
        if (comment) {
          ret += comment.value;
          continue;
        }
      }
      ret += lexer.next();
    }
    if (nums !== 0 && !options.ignoreEnd) {
      return lexer.error('get matched string ' + start + ' & ' + end + 'error', true);
    }
    return ret;
  },
  /**
   * get tpl matched
   * @param  {String} start []
   * @param  {String} end   []
   * @param  {Object} lexer []
   * @return {}       []
   */
  getMatched: function(start, end, lexer){
    return this._getMatched(start, end, lexer);
  }
})