var casePath = __dirname + '/case/';
var fs = require('fs');
var assert = require('assert');
var should = require('should');
var muk = require('muk');

var think = require('thinkjs-util');
var flkit = require('../lib/index.js');
var cls = flkit.load('html', 'lexer');

['html', 'css', 'js'].forEach(function(lang){
  if (!think.isDir(casePath + lang)) {
    return;
  }
  describe(lang, function(){
    var files = fs.readdirSync(casePath + lang);
    files.forEach(function(file){
      describe(file.split('.')[0], function(){
        var filePath = casePath + lang + '/' + file;
        var data = JSON.parse(think.getFileContent(filePath) || '{}');
        for(var key in data){
          it(key, (function(key){
            return function(){
              var instance = flkit.getInstance(lang, file.split('.')[0], data[key].code);
              instance.tpl = data[key].tpl;
              if (data[key].ld) {
                instance.ld = data[key].ld.split(',');
              }else{
                instance.ld = '';
              }
              if (data[key].rd) {
                instance.rd = data[key].rd.split(',');
              }else{
                instance.rd = '';
              }
              var ret;
              try{
                ret = instance.run(data[key].options);
              }catch(e){
                ret = e.toString();
              }
              if (typeof ret === 'string') {
                assert.equal(ret, data[key].result);
              }else{
                assert.equal(JSON.stringify(ret), JSON.stringify(data[key].result));
              }
            }
          })(key))
        }
      })
    })
  })
  
})