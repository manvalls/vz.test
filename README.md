[![NPM](https://nodei.co/npm/vz.test.png?downloads=true)](https://nodei.co/npm/vz.test/)

This package uses or may use at some point in the future ECMAScript 6 features. Use it on a compatible environment or transpile it with Traceur, Closure Compiler, es6-transpiler or equivalent. Please note that some of these have flaws and bugs, test your code carefully until you find a suitable tool for your task.

When cloning this repository, put the folder inside another named "node_modules" in order to avoid potential errors related to npm's dependency handling, and then run `npm install` on it.

No piece of software is ever completed, feel free to contribute and be humble.

# vz Test

## Sample usage:

```javascript
var test = require('vz.test'),
    assert = require('assert');

test('Array',function(){
  
  test('#indexOf()',function(){
    
    test('should return -1 when the value is not present',function(){
      
      assert([1,2,3].indexOf(5) == -1);
      assert([1,2,3].indexOf(0) == -1);
      
    });
    
  });
  
});
```
