// var agent = require('webkit-devtools-agent');
// agent.start({
//   port: 9999,
//   bind_to: '0.0.0.0',
//   ipc_port: 3333,
//   verbose: true
// });
var content = require('fs').readFileSync('page.css', 'utf8');
var flkit = require('../../index.js');
var lexerInstance = flkit.getInstance('css', 'lexer', content);
// setTimeout(function(){
  var startTime = Date.now();
  var ret = lexerInstance.run({});
  var endTime = Date.now();
  console.log(endTime - startTime);
// }, 20000)

//
//require('fs').writeFileSync('result.json', JSON.stringify(ret, undefined, 4))