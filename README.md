FLKit
=====

FLKit is a front-end language(HTML、CSS、JS) toolkit that support template syntax(etc: Smarty, PHP). 

## Support Template Syntax

* Smarty
* PHP
* other template syntax with delimiter

advanced support:

* support nesting delimiter: `<% $value = <%$name%> + 1 %>`
* support multi delimiter: `<% $value = 1%> <& $value &>`

## Test

```
npm test
```

FLKit also support test in web, you can use it by following steps:

* enter `web` directory
* exec `npm install` to install dependencies
* enter `www` directory, exec `node index.js`
* open browser, open `http://localhost:8360/`

## LICENSE

[MIT](https://github.com/flkit/flkit/blob/master/LICENSE)