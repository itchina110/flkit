'use strict';

var think = require('thinkjs-util');
var base = require('./base.js');

/**
 * comment type list
 * @type {Object}
 */
var comments = {
  line: ['//', '\n'],
  multi: ['/*', '*/'],
  html: ['<!--', '-->']
}

module.exports = think.Class(base, {
  /**
   * text lexer position
   * @type {Number}
   */
  pos: 0,
  /**
   * token position
   * @type {Number}
   */
  tokpos: 0,
  /**
   * text lexer line
   * @type {Number}
   */
  line: 0,
  /**
   * token line
   * @type {Number}
   */
  tokline: 0,
  /**
   * text lexer col
   * @type {Number}
   */
  col: 0,
  /**
   * token col
   * @type {Number}
   */
  tokcol: 0,
  /**
   * newline nums before token
   * @type {Number}
   */
  newlines: 0,
  /**
   * commnets before token
   * @type {Array}
   */
  comments: [],
  /**
   * get next char
   * @return {Function} [description]
   */
  next: function(){
    
  }
})