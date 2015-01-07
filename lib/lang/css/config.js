'use strict';

var TOKEN = require('../../util/token.js');

module.exports = {
  /**
   * @ type
   * @type {Array}
   */
  atType: [
    ['@import', TOKEN.CSS_IMPORT],
    ['@charset', TOKEN.CSS_CHARSET],
    ['@media', TOKEN.CSS_MEDIA],
    ['@namespace', TOKEN.CSS_NAMESPACE],
    ['@font-face', TOKEN.CSS_FONT_FACE],
    ['@page', TOKEN.CSS_PAGE],
    ['@keyframes', TOKEN.CSS_KEYFRAMES],
    ['@-webkit-keyframes', TOKEN.CSS_KEYFRAMES],
    ['@-moz-keyframes', TOKEN.CSS_KEYFRAMES],
    ['@-ms-keyframes', TOKEN.CSS_KEYFRAMES],
    ['@-o-keyframes', TOKEN.CSS_KEYFRAMES],
    ['@-moz', TOKEN.CSS_AT]
  ]
}