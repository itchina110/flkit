var str = require('fs').readFileSync('1.txt', 'utf8');
var flkit = require('../lib/index.js');
var instance = flkit.getInstance('html', 'lexer', str);
var start = Date.now();
var result = instance.run();
var end = Date.now();
console.log(end - start)