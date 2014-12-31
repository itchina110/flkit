'use strict';

module.exports = {
  /**
   * check template syntax has output
   * @param  {String}  tpl [description]
   * @return {Boolean}     [description]
   */
  hasOutput: function(tplToken){
    var code = tplToken._value.trim().charCodeAt(0);
    return code === 0x24;
  }
}