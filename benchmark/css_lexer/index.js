var content = require('fs').readFileSync('page.css', 'utf8');
var flkit = require('../../index.js');
var startTime = Date.now();
var lexerInstance = flkit.getInstance('css', 'lexer', content);
var ret = lexerInstance.run({
 
});
var endTime = Date.now();
console.log(endTime - startTime);
require('fs').writeFileSync('result.json', JSON.stringify(ret, undefined, 4))