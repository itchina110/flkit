'use strict';

var TOKEN = require('../../util/token.js');
var baseUtil = require('../../util/util.js');


module.exports = {
  /**
   * special tokens
   * @type {Array}
   */
  specialTokens: [
    ['<script ', '</script>', TOKEN.HTML_TAG_SCRIPT],
    ['<script>', '</script>', TOKEN.HTML_TAG_SCRIPT],
    ['<style ', '</style>', TOKEN.HTML_TAG_STYLE],
    ['<style>', '</style>', TOKEN.HTML_TAG_STYLE],
    ['<pre ', '</pre>', TOKEN.HTML_TAG_PRE],
    ['<pre>', '</pre>', TOKEN.HTML_TAG_PRE],
    ['<textarea ', '</textarea>', TOKEN.HTML_TAG_TEXTAREA],
    ['<textarea>', '</textarea>', TOKEN.HTML_TAG_TEXTAREA],
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
  reservedCommentPrefix: ['<!--#', '<!--[if', '<!--!', '<!--<![endif', '<![if '],
  /**
   * void elements
   * http://www.w3.org/TR/html5/syntax.html#void-elements
   * @type {Object}
   */
  /*jslint maxlen: 500 */
  voidElements: baseUtil.toObj(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']),
  /**
   * optional end tags
   * @type {Object}
   */
  optionalEndTags: {
    html: {
      next_comment: false
    },
    head: {
      next_comment: false, 
      next_space: false
    },
    body: {
      next_comment: false
    },
    li: {
      next: ['li'],
      next_parent: true
    },
    dt: {
      next: ['dt', 'dd']
    },
    dd: {
      next: ['dt', 'dd'],
      next_parent: true
    },
    p: {
      /*jslint maxlen: 500 */
      next: ['address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table'],
      parent_not: ['a']
    },
    rb: {
      next: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    rt: {
      next: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    rtc: {
      next: ['rb', 'rtc', 'rp'],
      next_parent: true
    },
    rp: {
      next: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    optgroup: {
      next: ['optgroup'],
      next_parent: true
    },
    option: {
      next: ['option', 'optgroup'],
      next_parent: true
    },
    colgroup: {
      next_space: false, 
      next_comment: false
    },
    thead: {
      next: ['tbody', 'tfoot']
    },
    tbody: {
      next: ['tbody', 'tfoot'],
      next_parent: true
    },
    tfoot: {
      next: ['tbody'],
      next_parent: true
    },
    tr: {
      next: ['tr'],
      next_parent: true
    },
    td: {
      next: ['td', 'th'],
      next_parent: true
    },
    th: {
      next: ['td', 'th'],
      next_parent: true
    }
  },
  /**
   * optional start tags
   * @type {Object}
   */
  optionalStartTags: {},
  /**
   * optional attribute value
   * @type {Object}
   */
  optionalAttrValue: {
    '*': {
      'class': '',
      alt: '',
      title: '',
      style: '',
      id: '',
      name: ''
    },
    link: {
      media: 'screen',
      type: 'text/css'
    },
    // use input[type="text"] in css
    /*input: {
      type: 'text'
    }*/
    form: {
      method: 'get'
    },
    style: {
      type: 'text/css',
      rel: 'stylesheet'
    },
    script: {
      type: 'text/javascript',
      language: 'javascript'
    }
  },
  /**
   * Empty attribute syntax
   * http://www.w3.org/TR/html5/syntax.html#syntax-attribute-name
   * @type {Object}
   */
  emptyAttribute: baseUtil.toObj(['disabled', 'selected', 'checked', 'readonly', 'multiple']),

}