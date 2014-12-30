'use strict';

var tokenList = require('./util/token.js');
var think = require('thinkjs-util');

module.exports = {
  /**
   * [getInstance description]
   * @return {[type]} [description]
   */
  getInstance: function(type, name, text){
    var cls = this.load(type, name);
    return cls(text);
  },
  /**
   * load file
   * @param  {[type]} type [description]
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  load: function(type, name){
    var file = __dirname + '/lang/' + type + '/' + name + '.js';
    if (!think.isFile(file)) {
      throw new Error(type + '/' + name + ' is not valid');
    }
    return require(file);
  },
  /**
   * token list
   * @type {[Object]}
   */
  TOKEN: tokenList
}