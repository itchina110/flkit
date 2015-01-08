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
  hasOutput: function(token){
    return false;
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
        ret = lexer.slice(lexer.pos);
        lexer.pos = lexer.length;
        return ret;
      }
      return false;
    }
    ret = lexer.forward(startLength);
    var nums = 0, chr = lexer.text[lexer.pos], code, nextCode;
    var nest = options.nest, quote = options.quote, escape = false;
    var multi_comment = options.multi_comment, line_comment = options.line_comment, comment;
    while(true){
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
      if (quote) {
        if (code === 0x5c) {
          escape = !escape;
          ret += chr;
          continue;
        }else if (code === 0x22 || code === 0x27) {
          if (escape) {
            escape = false;
            ret += chr;
          }else{
            ret += lexer.getQuote();
          }
          continue;
        }
      }
      //comment
      if (code === 0x2f) { // /
        nextCode = lexer.text.charCodeAt(lexer.pos + 1);
        if (multi_comment && nextCode === 0x2a) {
          comment = lexer.getComment('multi');
          if (comment) {
            ret += comment.value;
            continue;
          }
        }else if (line_comment && nextCode === 0x2f) {
          comment = lexer.getLineComment();
          if (comment) {
            ret += comment.value;
            continue;
          }
        }
      }
      chr = lexer.next();
      if (chr === false) {
        break;
      }
      ret += chr;
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