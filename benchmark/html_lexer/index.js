var content = require('fs').readFileSync('page.html', 'utf8');
var flkit = require('../../index.js');
var startTime = Date.now();
var lexerInstance = flkit.getInstance('html', 'lexer', content);
var ret = lexerInstance.run({
  tag_attrs: false
});
var endTime = Date.now();
console.log(endTime - startTime);
//require('fs').writeFileSync('result.json', JSON.stringify(ret, undefined, 4))