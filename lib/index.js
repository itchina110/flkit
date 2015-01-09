'use strict';

var think = require('thinkjs-util');

var tokenList = require('./util/token.js');
var template = require('./template/base.js');

module.exports = {
  /**
   * get class instance
   * @return {} []
   */
  getInstance: function(lang, name, text){
    var cls = this.load(lang, name);
    return cls(text);
  },
  /**
   * load class file
   * @param  {String} lang []
   * @param  {String} name []
   * @return {Object}      []
   */
  load: function(lang, name){
    var file = __dirname + '/lang/' + lang + '/' + name + '.js';
    if (!think.isFile(file)) {
      throw new Error(lang + '/' + name + ' is not valid');
    }
    return require(file);
  },
  /**
   * template base class
   * @type {Function}
   */
  template: template,
  /**
   * token list
   * @type {Object}
   */
  TOKEN: tokenList
}