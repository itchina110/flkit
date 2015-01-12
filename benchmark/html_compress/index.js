var content = require('fs').readFileSync('page.html', 'utf8');
var flkit = require('../../index.js');
var startTime = Date.now();
var lexerInstance = flkit.getInstance('html', 'compress', content);
var ret = lexerInstance.run();
var endTime = Date.now();
console.log(endTime - startTime);
require('fs').writeFileSync('result.html', ret)