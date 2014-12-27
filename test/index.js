var str = require('fs').readFileSync('1.txt', 'utf8');
var flkit = require('../lib/index.js');
var instance = flkit.getInstance('html', 'lexer', str);
var result = instance.run();
console.log(JSON.stringify(result, undefined, 4))