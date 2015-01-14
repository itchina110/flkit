'use strict';

var lexer = require('../../util/lexer.js');
var think = require('thinkjs-util');
var TOKEN = require('../../util/token.js');
var util = require('./util.js');
var config = require('./config.js');
var Message = require('../../util/message.js');


var specialTokens = config.specialTokens;
var specialTokensLength = specialTokens.length;
var rawTokens = config.rawTokens;
var rawTokensLength = rawTokens.length;
var isArray = think.isArray;
var reservedCommentPrefix = config.reservedCommentPrefix;
var reservedCommentLength = reservedCommentPrefix.length;
var isTagFirstChar = util.isTagFirstChar;
var isTagNameChar = util.isTagNameChar;
var parseScriptAttr = util.parseScriptAttr;
var parseStyleAttr = util.parseStyleAttr;

/**
 * get html tokens 
 * @return {Array}     []
 */
module.exports = think.Class(lexer, {
  /**
   * text is xml content
   * @type {Boolean}
   */
  isXML: false,
  /**
   * options
   * @type {Object}
   */
  options: {
    tag_attrs: false
  },
  /**
   * get next token
   * @return {Object} [token]
   */
  getNextToken: function(){
    var token = this._getNextToken();
    if (token || token === false) {
      return token;
    }
    var code = this._text.charCodeAt(this.pos);
    // 0x3c is <
    if (code === 0x3c) {
      var nextCode = this._text.charCodeAt(this.pos + 1);
      //all special token start with <!
      token = nextCode === 0x21 ? this.getSpecialToken() : this.getRawToken();
      if (token) {
        return token;
      }
      if (isTagFirstChar(nextCode)) {
        return this.getTagToken();
      }
    }
    return this.getTextToken();
  },
  /**
   * get text token
   * @return {Object} []
   */
  getTextToken: function(){
    var ret = '', chr;
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      if (chr.charCodeAt(0) === 0x0a) {
        this.newlineBefore--;
      }
      if (this.isTplNext()) {
        break;
      }
      var nextCode = this._text.charCodeAt(this.pos);
      var next2Code = this._text.charCodeAt(this.pos + 1);
      //if next char is < and next2 char is tag first char
      if (nextCode === 0x3c && (next2Code ===  0x21 || isTagFirstChar(next2Code))) {
        break;
      }
      ret += this.next();
    }
    var token = this.getToken(TOKEN.HTML_TEXT, ret);
    token.value = this.skipRightSpace(ret);
    return token;
  },
  /**
   * get tag token
   * @return {Object} []
   */
  getTagToken: function(){
    this.record();
    var ret = this.next();
    var type, tagEnd = false, chr, escape = false, quote;
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this.text[this.pos];
      var code = this._text.charCodeAt(this.pos);
      if (!type) {
        switch(code){
          case 0x2f: // /
            var nextCode = this._text.charCodeAt(this.pos + 1);
            //if next char is not  >= 'a' && <= 'z', throw error
            if (nextCode >= 0x61 && nextCode <= 0x7a) {
              type = TOKEN.HTML_TAG_END;
            }else{
              type = TOKEN.ILLEGAL;
            }
            break;
          case 0x3f: // ?
            ret += this.next();
            if (this.lookAt('xml ') || this.lookAt('xml>')) {
              type = TOKEN.HTML_TAG_XML;
              this.isXML = true;
            }else{
              type = TOKEN.HTML_TAG_START;
            }
            break;
          default:
            //a-z
            if (code >= 0x61 && code <= 0x7a) {
              if (this.options.tag_attrs){
                var tagName = this.getTagName();
                var tagAttrs = this.getTagAttrs();
                var str = '<' + tagName + tagAttrs.value;
                //get tag attrs error
                if (tagAttrs.message) {
                  return this.getToken(TOKEN.ILLEGAL, str, {
                    message: tagAttrs.message
                  })
                }
                return this.getToken(TOKEN.HTML_TAG_START, str, {
                  tag: tagName,
                  _tag: tagName.toLowerCase(),
                  attrs: tagAttrs.attrs
                })
              }else{
                type = TOKEN.HTML_TAG_START;
              }
            }else{
              type = TOKEN.ILLEGAL;
              //this.error('tag name is not valid', true);
            }
            break;
        }
      }
      if (code === 0x5c || escape) { // \
        escape = !escape;
        ret += this.next();
        continue;
      }else if (!escape && (code === 0x22 || code === 0x27)) { //char is ' or "
        quote = this.getQuote({
          checkNext: true
        });
        ret += quote.value;
        if (!quote.find) {
          return this.getToken(TOKEN.ILLEGAL, ret, {
            message: Message.UnMatchedQuoteChar
          })
        }
        continue;
      }
      var tpl = this.getTplToken();
      if (tpl) {
        ret += tpl.value;
        continue;
      }
      //0x3e is >
      if (code === 0x3e) {
        ret += this.next();
        tagEnd = true;
        break;
      }
      ret += this.next();
    }
    if (!tagEnd) {
      return this.getToken(TOKEN.ILLEGAL, ret, {
        message: Message.TagUnClosed
      })
    }
    //get tag attrs
    if (this.options.tag_attrs && type === TOKEN.HTML_TAG_END) {
      // 8.1.2.2 in http://www.w3.org/TR/html5/syntax.html
      // in end tag, may be have whitespace on right 
      var tag = ret.slice(2, -1).trim(); 
      return this.getToken(type, ret, {
        tag: tag,
        _tag: tag.toLowerCase()
      });
    }
    return this.getToken(type, ret);
  },
  /**
   * get tag name
   * @return {[type]} [description]
   */
  getTagName: function(){
    var chr, ret = '';
    /*jshint -W084 */
    while(this.pos < this.length){
      chr = this._text[this.pos];
      if (!isTagNameChar(chr.charCodeAt(0))) {
        break;
      }
      ret += this.next();
    }
    return ret;
  },
  /**
   * get tag attrs
   * http://www.w3.org/TR/html5/syntax.html
   * @param  {String} tag [tag string]
   * @return {Object}     [tag name & attrs]
   */
  getTagAttrs: function(){
    var attrs = [], chr, code, value = '';
    var hasEqual = false, spaceBefore = false, tagEnd = false;
    var tplInstance = this.getTplInstance(true);
    var attrName = '', attrValue = '', escape = false, tplToken;
    /*jshint -W084 */
    while(this.pos < this.length){
      tplToken = this.getTplToken();
      if (tplToken) {
        value += tplToken.value;
        if (tplInstance.hasOutput(tplToken)) {
          if (hasEqual) {
            attrValue += tplToken.value;
          }else{
            attrName += tplToken.value;
          }
        }else{
          if (hasEqual) {
            if (attrValue) {
              attrs.push({name: attrName, value: attrValue}, tplToken);
              attrName = attrValue = '';
            }else{
              attrValue += tplToken.value;
            }
          }else{
            if (attrName) {
              attrs.push({name: attrName});
            }
            tplToken.spaceBefore = spaceBefore;
            attrs.push(tplToken);
            attrName = attrValue = '';
          }
        }
        spaceBefore = false;
        continue;
      }
      chr = this.text[this.pos];
      code = chr.charCodeAt(0);
      value += chr;
      // char is >
      if (code === 0x3e) {
        tagEnd = true;
        this.next();
        break;
      }else if(code === 0x5c || escape){ // \
        escape = !escape;
        if (hasEqual) {
          attrValue += chr;
        }else{
          attrName += chr;
        }
        this.next();
        continue;
      }else if (code === 0x3d) { // char is =
        hasEqual = true;
        spaceBefore = false;
      }else if (!hasEqual && code === 0x2f) { //0x2f is /
        if (this.text.charCodeAt[this.pos - 1] !== 0x2f) {
          if (attrName) {
            attrs.push({name: attrName});
          }
          attrName = attrValue = '';
          hasEqual = false;
        }
      }else if (!escape && (code === 0x22 || code === 0x27)) { // char is ' or "
        var quote = this.getQuote({
          checkNext: true
        });
        value += quote.value.slice(1);
        //quote string not found
        if (!quote.find) {
          return {
            value: value,
            message: Message.UnMatchedQuoteChar
          }
        }
        //has no equal char, quot string add to attribute name
        if (!hasEqual) {
          attrName += quote.value;
        }else{
          attrValue += quote.value;
          attrs.push({name: attrName, value: attrValue});
          attrName = attrValue = '';
          hasEqual = spaceBefore = false;
        }
        continue;
      }else if (this.isWhiteSpace(code)) { // whitespace
        if (hasEqual && attrValue) {
          attrs.push({name: attrName, value: attrValue});
          attrName = attrValue = '';
          hasEqual = spaceBefore = false;
        }else{
          spaceBefore = true;
        }
      }else{
        if (hasEqual) {
          attrValue += chr;
        }else{
          if (spaceBefore && attrName) {
            attrs.push({name: attrName});
            attrName = chr;
          }else{
            attrName += chr;
          }
        }
        spaceBefore = false;
      }
      this.next();
    }
    //add extra attr name or attr value
    if (attrName || attrValue) {
      if (hasEqual) {
        attrs.push({name: attrName, value: attrValue});
      }else{
        attrs.push({name: attrName});
      }
    }
    if (!tagEnd) {
      return {
        value: value,
        message: Message.TagUnClosed
      }
    }
    //add _name, _value for attr item
    for(var i = 0, length = attrs.length, item; i < length; i++){
      item = attrs[i];
      if (item.ld) {
        attrs[i].tpl = true;
        continue;
      }else if (item.value !== undefined) {
        code = item.value.charCodeAt(0);
        if (code === 0x22 || code === 0x27) {
          attrs[i].quote = item.value.slice(0, 1);
          attrs[i]._value = item.value.slice(1, -1);
        }else{
          attrs[i].quote = '';
          attrs[i]._value = item.value;
        }
      }
      //template syntax in attribute name
      //may be has uppercase chars in template syntax
      //etc: <input <?php echo $NAME;?>name="value" >
      if (this.containTpl(item.name)) {
        attrs[i]._name = item.name;
      }else{
        attrs[i]._name = item.name.toLowerCase();
      }
    }
    return {
      value: value,
      attrs: attrs
    }
  },
  /**
   * skip comment
   * @return {void} []
   */
  skipComment: function(){
    //start with <!
    commentLabel: while(this.text.charCodeAt(this.pos) === 0x3c && this.text.charCodeAt(this.pos + 1) === 0x21){
      for(var i = 0; i < reservedCommentLength; i++){
        if (this.lookAt(reservedCommentPrefix[i])) {
          break commentLabel;
        }
      }
      //template delimiter may be <!-- & -->
      if (this.isTplNext()) {
        break;
      }
      var comment = this.getCommentToken(2);
      if (comment) {
        this.commentBefore.push(comment);
      }else{
        break;
      }
    }
  },
  /**
   * get raw element token
   * @return {Object} []
   */
  getRawToken: function(){
    var i = 0, item, pos = 0, code, startToken, contentToken, endToken, token;
    /*jshint -W084 */
    while(i < rawTokensLength){
      item = rawTokens[i++];
      if (!this.lookAt(item[0])) {
        continue;
      }
      code = this._text.charCodeAt(this.pos + item[0].length);
      //next char is not space or >
      if (!this.isWhiteSpace(code) && code !== 0x3e) {
        continue;
      }
      pos = this.find(item[1]);
      if (pos === -1) {
        return;
      }
      code = this._text.charCodeAt(pos + item[1].length);
      //next char is not space or >
      if (!this.isWhiteSpace(code) && code !== 0x3e) {
        continue;
      }
      token = this.getToken(item[2], '');

      this.startToken();
      startToken = this.getTagToken();
      //start token is not valid
      if (startToken.type === TOKEN.ILLEGAL) {
        return startToken;
      }
      if (item[2] === TOKEN.HTML_TAG_SCRIPT && this.options.tag_attrs) {
        startToken = parseScriptAttr(startToken);
      }else if (item[2] === TOKEN.HTML_TAG_STYLE && this.options.tag_attrs) {
        startToken = parseStyleAttr(startToken);
      }
      this.startToken();
      contentToken = this.getToken(TOKEN.HTML_RAW_TEXT, this.forward(pos - this.pos));
      this.startToken();
      endToken = this.getTagToken();
      token.value = startToken.value + contentToken.value + endToken.value;
      token.start = startToken;
      token.content = contentToken;
      token.end = endToken;
      return token;
    }
  },
  /**
   * get special token
   * @return {Object} []
   */
  getSpecialToken: function(){
    var pos, npos, findItem, j, length, ret, i = 0, item;
    /*jshint -W084 */
    while(i < specialTokensLength){
      item = specialTokens[i++];
      //if text is not start with item[0], continue
      if (!this.lookAt(item[0])) {
        continue;
      }
      if (isArray(item[1])) {
        pos = -1;
        findItem = '';
        for(j = 0, length = item[1].length; j < length; j++){
          npos = this.find(item[1][j]);
          if (npos === -1) {
            continue;
          }
          if (pos === -1) {
            pos = npos;
            findItem = item[1][j];
          }else if (npos < pos) {
            pos = npos;
            findItem = item[1][j];
          }
        }
        //find end special chars
        if (findItem) {
          length = pos + findItem.length - this.pos;
          ret = this.text.substr(this.pos, length);
          this.forward(length);
          return this.getToken(item[2], ret);
        }
      }else{
        ret = this.getMatched(item[0], item[1]);
        if (ret) {
          return this.getToken(item[2], ret);
        }
      }
    }
  }
})