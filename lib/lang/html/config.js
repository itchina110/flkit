'use strict';

var TOKEN = require('../../util/token.js');
var baseUtil = require('../../util/util.js');


module.exports = {
  /**
   * special tokens
   * @type {Array}
   */
  specialTokens: [
    ['<!--[if', [']><!-->', ']>-->', ']>'], TOKEN.IE_HACK],
    ['<![if ', ']>', TOKEN.IE_HACK],
    ['<![endif', [']>', ']-->'], TOKEN.IE_HACK],
    ['<!--<![endif', ']-->', TOKEN.IE_HACK],
    ['<!--#', '-->', TOKEN.IE_HACK],
    ['<!doctype ', '>', TOKEN.HTML_DOCTYPE],
    ['<!--!', '-->', TOKEN.RESERVED_COMMENT],
    ['<![cdata[', ']]>', TOKEN.HTML_CDATA]
  ],
  /**
   * html raw element tokens
   * @type {Array}
   */
  rawTokens: [
    ['<script', '</script', TOKEN.HTML_TAG_SCRIPT],
    ['<style', '</style', TOKEN.HTML_TAG_STYLE],
    ['<pre', '</pre', TOKEN.HTML_TAG_PRE],
    ['<textarea', '</textarea', TOKEN.HTML_TAG_TEXTAREA],
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
  voidElements: baseUtil.toHash([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]),
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
      next_element: ['li'],
      next_parent: true
    },
    dt: {
      next_element: ['dt', 'dd']
    },
    dd: {
      next_element: ['dt', 'dd'],
      next_parent: true
    },
    p: {
      /*jslint maxlen: 500 */
      next_element: [
        'address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'footer', 'form', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 
        'pre', 'section', 'table'
      ],
      parent_not: ['a']
    },
    rb: {
      next_element: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    rt: {
      next_element: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    rtc: {
      next_element: ['rb', 'rtc', 'rp'],
      next_parent: true
    },
    rp: {
      next_element: ['rb', 'rt', 'rtc', 'rp'],
      next_parent: true
    },
    optgroup: {
      next_element: ['optgroup'],
      next_parent: true
    },
    option: {
      next_element: ['option', 'optgroup'],
      next_parent: true
    },
    colgroup: {
      next_space: false, 
      next_comment: false
    },
    thead: {
      next_element: ['tbody', 'tfoot']
    },
    tbody: {
      next_element: ['tbody', 'tfoot'],
      next_parent: true
    },
    tfoot: {
      next_element: ['tbody'],
      next_parent: true
    },
    tr: {
      next_element: ['tr'],
      next_parent: true
    },
    td: {
      next_element: ['td', 'th'],
      next_parent: true
    },
    th: {
      next_element: ['td', 'th'],
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
  emptyAttribute: baseUtil.toHash(['disabled', 'selected', 'checked', 'readonly', 'multiple']),
  /**
   * in safe tag, can remove space before it
   * @type {Object}
   */
  safeTag: baseUtil.toHash(['html', 'meta', 'style', 'script', 'head', 'link', 'title', 'body', 'noscript']),
  /**
   * block tag
   * @type {[type]}
   */
  blockTag: baseUtil.toHash([
    'html', 'meta', 'style', 'script', 'head', 'link', 'title', 'body', 'noscript', 'address', 'blockquote',
    'center', 'dir', 'div', 'dl', 'fieldset', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'menu', 'noframes',
    'noscript', 'ol', 'p', 'pre', 'table', 'ul', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'section', 'header',
    'footer', 'hgroup', 'nav', 'dialog', 'datalist', 'details', 'figcaption', 'figure', 'meter', 'output', 'progress'
  ])
}