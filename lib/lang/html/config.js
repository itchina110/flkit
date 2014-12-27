'use strict';

var TOKEN = require('../../util/token.js');


module.exports = {
  /**
   * special tokens
   * @type {Array}
   */
  specialTokens: [
    ['<script', '</script>', TOKEN.HTML_TAG_SCRIPT],
    ['<style', '</style>', TOKEN.HTML_TAG_STYLE],
    ['<pre', '</pre>', TOKEN.HTML_TAG_PRE],
    ['<textarea', '</textarea>', TOKEN.HTML_TAG_TEXTAREA],
    ['<!--[if', [']><!-->', ']>-->', ']>'], TOKEN.IE_HACK],
    ['<![if ', ']>', TOKEN.IE_HACK],
    ['<![endif', [']>', ']-->'], TOKEN.IE_HACK],
    ['<!--<![endif', ']-->', TOKEN.IE_HACK],
    ['<!--#', '-->', TOKEN.IE_HACK],
    ['<!doctype', '>', TOKEN.HTML_DOCTYPE],
    ['<!--!', '-->', TOKEN.RESERVED_COMMENT],
    ['<![cdata[', ']]>', TOKEN.HTML_CDATA]
  ],
  /**
   * reserved comment prefix
   * @type {Array}
   */
  resveredCommentPrefix: ['<!--#', '<!--[if', '<!--!', '<!--<![endif', '<![if '],
}