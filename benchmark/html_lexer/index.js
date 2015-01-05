var content = require('fs').readFileSync('page.html', 'utf8');
var flkit = require('../../index.js');
var startTime = Date.now();
var lexerInstance = flkit.getInstance('html', 'lexer', content);
lexerInstance.run({
  tag_attrs: true
});
var endTime = Date.now();
console.log(endTime - startTime);
