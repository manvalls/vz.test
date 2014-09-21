# vz Test

[![NPM](https://nodei.co/npm/vz.test.png?downloads=true)](https://nodei.co/npm/vz.test/)

No piece of software is ever completed, feel free to contribute and be humble

## Sample usage:

### Synchronous test

```javascript
var Test = require('vz.test'),
    assert = require('assert');

new Test('Array',function(test){
  new Test('#indexOf()',function(test){
    new Test('should return -1 when the value is not present',function(test){
      assert([1,2,3].indexOf(5) == -1);
      assert([1,2,3].indexOf(0) == -1);
    });
  });
});
```

### Asynchronous test

```javascript
new Test('setTimeout',function(test){
  new Test('should call functions when given time has passed, within a 10ms margin',function(test){
    var t0 = Date.now();
    
    setTimeout(test.wrap(function(){
      assert(Math.abs(Date.now() - t0 - 1000) < 10);
    }),1000);
    
    setTimeout(test.wrap(function(){
      assert(Math.abs(Date.now() - t0 - 2000) < 10);
    }),2000);
    
  });
});
```
