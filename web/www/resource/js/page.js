$(function(){
  $.fn.delegates = function(configs){
      el = $(this[0]);
      for(var name in configs){
          var value = configs[name];
          if (typeof value == 'function') {
              var obj = {};
              obj.click = value;
              value = obj;
          };
          for(var type in value){
              el.delegate(name, type, value[type]);
          }
      }
      return this;
  }

  var modalNeedInit = true;
  var editorInstance = null;
  var caseListData = {};

  function initModal(){
    if (!modalNeedInit) {
      //return;
    }
    var html = $('#modalTpl').html();
    $('#modalBody').html(html);
    initEditor();
  }
  function getLang(){
    var hash = (location.hash || '#').slice(1);
    return hash.split(':')[0] || 'html';
  }
  function initEditor(){
    var lang = getLang();
    editorInstance = CodeMirror.fromTextArea($('#codeArea')[0], {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true,
        mode: lang,
        lineWrapping: true,
        viewportMargin: Infinity
    });
    editorInstance.setOption("theme", "solarized dark")
  }
  function getTestData(){
    var name = (location.hash || '#').slice(1).split(':');
    var lang = name[0] || 'html';
    name = name[1] || 'lexer';
    var code = editorInstance.getValue();
    var tpl = $('#tpl').val();
    var ld = $('#ld').val();
    var rd = $('#rd').val();
    var options = {};
    return {
      lang: lang,
      name: name,
      code: code,
      tpl: tpl,
      ld: ld,
      rd: rd,
      options: JSON.stringify(options)
    }
  }
  var htmlMaps = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '\n': '\\n',
    '\t': '\\t'
  }
  var escape_html = function (str) {
    return (str + "").replace(/[<>'"\n\t]/g, function(a){
      return htmlMaps[a];
    })
  }
  function init(){
    var name = (location.hash || '#').slice(1).split(':');
    var lang = name[0] || 'html';
    name = name[1] || 'lexer';
    $.get('/index/list', {
      name: name,
      lang: lang
    }).done(function(data){
      if (data.errno) {
        return alert(data.errmsg);
      }
      $('#caseNums').html(data.data.length);
      var html = [];
      data.data.forEach(function(item){
        caseListData[item.key] = item;
        if (item.success) {
          html.push('<div data-key="' + item.key + '" class="alert alert-success cast-item" role="alert">');
        }else{
          html.push('<div data-key="' + item.key + '" class="alert alert-danger cast-item" role="alert">');
        }
        html.push('<div>' + escape_html(item.code) + '</div>')
        html.push('<span class="glyphicon glyphicon-refresh btn-refresh" title="Retest"></span>');
        html.push('</div>');
      })
      $('#caseList').html(html.join(''))
    })
  }
  init();

  $(document.body).delegates({
    '#addTestBtn': function(){
      $('.modal-add-test').modal({
        keyboard: false
      })
      initModal();
    },
    '#testItBtn': function(){
      var data = getTestData();
      if (!data.code) {
        editorInstance.focus();
        return;
      }
      $.post('/index/test', data).done(function(data){
        var value = data.errmsg;
        if (!data.errno) {
          if (typeof data.data === 'string') {
            value = data.data;
          }else{
            value = JSON.stringify(data.data, undefined, 4);
          }
        }
        $('#testResultArea').val(value);
      })
    },
    '#saveCaseBtn': function(){
      var data = getTestData();
      if (!data.code) {
        editorInstance.focus();
        return;
      }
      $.post('/index/save', data).done(function(data){
        $('.modal-add-test').modal({
          show: false
        })
      })
    },
    '.btn-refresh': function(){
      var key = $(this).parents('div.alert').attr('data-key');
      var data = caseListData[key];
      $('.modal-add-test').modal({
        keyboard: false
      })
      initModal();
      editorInstance.getDoc().setValue(data.code);
      setTimeout(function(){
        editorInstance.focus();
      }, 2000)
      $('#tpl').val(data.tpl);
      $('#ld').val(data.ld);
      $('#rd').val(data.rd);
    }
  })

})