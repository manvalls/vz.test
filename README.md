# vz Test

[![NPM](https://nodei.co/npm/vz.test.png?downloads=true)](https://nodei.co/npm/vz.test/)

No piece of software is ever completed, feel free to contribute and be humble

## Sample usage:

```javascript
var Test = require('vz.test'),
    assert = require('assert');

new Test('Array').wrap(function(){
  new Test('#indexOf()').wrap(function(){
    new Test('should return -1 when the value is not present').wrap(function(){
      assert([1,2,3].indexOf(5) == -1);
      assert([1,2,3].indexOf(0) == -1);
    })();
  })();
})();
```
