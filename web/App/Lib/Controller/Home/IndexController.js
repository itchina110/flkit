/**
 * controller
 * @return 
 */

var flkit = require(ROOT_PATH + '/../../index.js');
module.exports = Controller("Home/BaseController", function(){
  "use strict";
  return {
    lang: {
      html: ['lexer', 'compress', 'beautify', 'filter']
    },
    /**
     * 首页
     * @return {[type]} [description]
     */
    indexAction: function(){
      var data = {};
      for(var lang in this.lang){
        data[lang] = {};
        this.lang[lang].forEach(function(item){
          var file = ROOT_PATH + '/../../lib/lang/' + lang + '/' + item + '.js';
          if (isFile(file)) {
            var cls = require(file);
            data[lang][item] = cls.__prop.options;
          }
        })
      }
      this.assign('lang', data);
      //render View/Home/index_index.html file
      this.display();
    },
    /**
     * list all test case
     * @return {[type]} [description]
     */
    listAction: function(){
      var lang = this.get('lang');
      var name = this.get('name');
      try{
        var instance = flkit.getInstance(lang, name, '');
      }catch(e){
        return this.error(101, 'params error');
      }
      var file = ROOT_PATH + '/../../test/case/' + lang + '/' + name + '.json';
      if (!isFile(file)) {
        return this.success([]);
      }
      var data = JSON.parse(getFileContent(file) || '{}');
      data = Object.values(data);
      var result = [];
      data.forEach(function(item){
        var instance = flkit.getInstance(item.lang, item.name, item.code);
        instance.tpl = item.tpl;
        instance.ld = (item.ld || '').split(',');
        instance.rd = (item.rd || '').split(',');
        try{
          var ret = instance.run(item.options);
          if (typeof result === 'string') {
            item.success = item.result === ret;
          }else{
            item.success = JSON.stringify(item.result) === JSON.stringify(ret);
          }
        }catch(e){
          item.success = item.result === e.toString();
        }
        delete item.result;
        if (item.success) {
          result.push(item)
        }else{
          result.unshift(item);
        }
      })
      return this.success(result);
    },
    /**
     * test case
     * @return {[type]} [description]
     */
    testAction: function(){
      var lang = this.post('lang');
      var name = this.post('name');
      var code = this.post('code');
      var tpl = this.post('tpl');
      var ld = this.post('ld');
      var rd = this.post('rd');
      try{
        var options = JSON.parse(this.post('options') || '{}');
        var instance = flkit.getInstance(lang, name, code);
      }catch(e){
        console.log(e.toString(), e.stack)
        return this.error(101, 'params error');
      }
      try{
        instance.tpl = tpl || '';
        instance.ld = (ld || '').split(',');
        instance.rd = (rd || '').split(',');
        var result = instance.run(options);
        return this.success(result);
      }catch(e){
        return this.error(100, e.toString());
      }
    },
    /**
     * save case
     * @return {[type]} [description]
     */
    saveAction: function(){
      var lang = this.post('lang') || 'html';
      var name = this.post('name') || 'lexer';
      var code = this.post('code');
      var tpl = this.post('tpl');
      var ld = this.post('ld');
      var rd = this.post('rd');
      var result;
      try{
        var options = JSON.parse(this.post('options') || '{}');
        var instance = flkit.getInstance(lang, name, code);
      }catch(e){
        return this.error(101, 'params error');
      }
      try{
        instance.tpl = tpl || '';
        instance.ld = (ld || '').split(',');
        instance.rd = (rd || '').split(',');
        result = instance.run(options);
      }catch(e){
        result = e.toString();
      }
      var data = {
        lang: lang,
        name: name,
        code: code,
        tpl: tpl,
        ld: ld,
        rd: rd,
        options: options
      }
      var key = md5(JSON.stringify(data));
      data.key = key;
      data.result = result;
      var file = ROOT_PATH + '/../../test/case/' + lang + '/' + name + '.json';
      var allData = {};
      if (isFile(file)) {
        allData = JSON.parse(getFileContent(file) || '{}');
      }
      allData[key] = data;
      setFileContent(file, JSON.stringify(allData, undefined, 4));
      return this.success();
    }
  };
});