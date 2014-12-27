'use strict';

var TOKEN = require('../../util/token.js');


module.exports = {
  /**
   * check code is tag name first char
   * @param  {Number}  code [description]
   * @return {Boolean}      [description]
   */
  isTagFirstChar: function(code){
    // a-z ! ?
    if (code >= 0x61 && code <= 0x7a || code === 0x3f || code === 0x21) {
      return true;
    }
    return false;
  }
}