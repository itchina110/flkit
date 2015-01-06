FLKit
=====

FLKit is a front-end language(HTML、CSS、JS) toolkit support template syntax(etc: Smarty, PHP). 

## Support Template Syntax

* Smarty
* PHP
* all template syntax with delimiter

advanced support:

* support nesting delimiter: `<% $value = <%$name%> + 1 %>`
* support multi delimiter: `<% $value = 1%> <& $value &>`

## Test

```
npm test
```

FLKit also support web test, you can use it by below steps:

* enter `web` directory
* exec `npm install`, install dependencies
* enter `www` directory & exec `node index.js`
* open browser, request `http://localhost:8360/`

## LICENSE

[MIT](https://github.com/flkit/flkit/blob/master/LICENSE)