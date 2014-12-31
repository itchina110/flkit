'use strict';


module.exports = {
  /**
   * check code is tag name first char
   * @param  {Number}  code [description]
   * @return {Boolean}      [description]
   */
  isTagFirstChar: function(code){
    // a-z ! ? /
    if (code >= 0x61 && code <= 0x7a || code === 0x3f || code === 0x21 || code === 0x2f) {
      return true;
    }
    return false;
  },
  /**
   * check code is tag name char
   * @param  {Number}  code [description]
   * @return {Boolean}      [description]
   */
  isTagNameChar: function(code){
    // a-z 0-9 :
    if (code >= 0x61 && code <= 0x7a || code === 0x3a || code >= 0x30 && code <= 0x39) {
      return true;
    }
    return false;
  }
}