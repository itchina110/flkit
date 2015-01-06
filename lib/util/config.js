'use strict';

var util = require('./util.js');

module.exports = {
  /**
   * whitespace
   * @type {[type]}
   */
  /*jslint maxlen: 500 */
  whitespace: util.toHash(' \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'),
  /**
   * comment type list
   * @type {Object}
   */
  comments: {
    /**
     * line comments
     * @type {Array}
     */
    line: ['//', '<!--', '-->'],
    multi: ['/*', '*/'],
    html: ['<!--', '-->']
  }
}