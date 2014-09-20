var Test,
    stack = [],
    unresolved = [],
    errors = [],
    Property = require('vz.property'),
    constants = require('vz.constants'),
    assert = require('assert'),
    
    proc = global.process,
    
    resolved = new Property(),
    t0 = new Property(),
    t = new Property(),
    ok = new Property(),
    parent = new Property(),
    children = new Property(),
    status = new Property(),
    wraps = new Property(),
    tests = new Property(),
    text = new Property();

function getNL(){
  switch(Test.syntax){
    case 'console': return '\n';
    case 'html': return '<br>';
  }
}

function red(txt){
  switch(Test.syntax){
    case 'console': return '\x1B[31m' + txt + '\x1B[39m';
    case 'html': return '<span style="color: red;">' + txt + '</span>';
  }
}

function green(txt){
  switch(Test.syntax){
    case 'console': return '\x1B[32m' + txt + '\x1B[39m';
    case 'html': return '<span style="color: green;">' + txt + '</span>';
  }
}

function print(test,offset){
  var ret = '',
      notOk = test.status != 'pass',
      c = children.get(test),
      time,
      i;
  
  ret += offset;
  if(c.length) ret += '[' + ok.get(test) + '/' + c.length + ']';
  ret += ' ' + text.get(test);
  
  switch(Test.status){
    case 'tick':
      ret += ' ' + (notOk?red('✗'):green('✓'));
      break;
    case 'text':
      ret += ' ' + (notOk?red(test.status):green(test.status));
      break;
    case 'TEXT':
      ret += ' ' + (notOk?red(test.status.toUpperCase()):green(test.status.toUpperCase()));
      break;
  }
  
  if(Test.times && !notOk){
    time = t.get(test);
    if(proc) time = (time[0] + time[1] * 1e-9)*1000;
    ret += ' (' + time.toFixed(Test.precision) + 'ms)';
  }
  
  switch(Test.mode){
    case 'details':
      offset += '  ';
      for(i = 0;i < c.length;i++) ret += '\n' + print(c[i],offset);
      break;
      
    case 'errors':
      if(notOk){
        offset += '  ';
        for(i = 0;i < c.length;i++){
          if(c[i].status != 'pass') ret += '\n' + print(c[i],offset);
        }
      }
      break;
      
    default:
      if(notOk){
        offset += '  ';
        for(i = 0;i < c.length;i++) ret += '\n' + print(c[i],offset);
      }
  }
  
  return ret;
}

function resolve(test){
  var p,
      i;
  
  if(Test.times){
    if(proc) t.set(test,proc.hrtime(t0.get(test)));
    else t.set(test,performance.now() - t0.get(test));
  }
  
  resolved.set(test,true);
  p = parent.get(test),
  i = unresolved.indexOf(test)
  
  if(i != -1) unresolved.splice(i,1);
  
  if(p){
    if(p.status != 'error'){
      if(test.status == 'error') status.set(p,'error');
      else if(test.status == 'fail') status.set(p,'fail');
    }
    
    if(test.status == 'pass') ok.of(p).value++;
    
    if(--tests.of(p).value == 0 && wraps.get(p) == 0) resolve(p);
    return;
  }
  
  if(Test.mode == 'errors' && test.status == 'pass') return;
  
  switch(Test.output){
    case 'std':
      console.log(print(test,''));
      break;
  }
}

module.exports = Test = function(txt){
  
  if(Test.times){
    if(proc) t0.set(this,proc.hrtime());
    else t0.set(this,performance.now());
  }
  
  resolved.set(this,false);
  unresolved.push(this);
  
  text.set(this,txt);
  children.set(this,[]);
  status.set(this,'pass');
  wraps.set(this,0);
  tests.set(this,0);
  ok.set(this,0);
  
  if(stack.length){
    children.get(stack[stack.length - 1]).push(this);
    parent.set(this,stack[stack.length - 1]);
    tests.of(stack[stack.length - 1]).value++;
  }
  
};

if(proc){
  
  Test.output = proc.env.output || 'std';
  Test.times = proc.env.times?(proc.env.times == 'true'?true:false):true;
  Test.errors = proc.env.errors?(proc.env.errors == 'true'?true:false):false;
  Test.precision = proc.env.precision || '2';
  Test.mode = proc.env.mode || 'default';
  Test.status = proc.env.status || 'tick';
  Test.syntax = proc.env.syntax || 'console';
  
  proc.on('exit',function(){
    var i,unr = unresolved.slice(0),ret;
    
    for(i = 0;i < unr.length;i++){
      if(tests.get(unr[i]) == 0){
        status.set(unr[i],'error');
        wraps.set(unr[i],0);
        resolve(unr[i]);
      }
    }
    
    if(Test.errors && errors.length){
      
      ret = '\nErrors: ';
      for(i = 0;i < errors.length;i++) if(errors[i].stack) ret += '\n\n' + errors[i].stack;
      ret += '\n';
      
      switch(Test.syntax){
        case 'html':
          ret = ret.replace(/\n/g,'<br>');
          break;
      }
      
      switch(Test.output){
        case 'std':
          console.log(ret);
          break;
      }
      
    }
  });
  
}else{
  
  Test.output = 'browser';
  Test.times = true;
  Test.precision = '2';
  Test.mode = 'default';
  Test.status = 'tick';
  Test.syntax = 'html';
  
}

Object.defineProperties(Test.prototype,{
  status: {
    get: function(){
      return status.get(this);
    },
    set: constants.NOOP
  },
  wrap: {value: function(f){
    var self = this,
        called = false;
    
    if(resolved.get(this)) throw new Error('Test already resolved, cannot call wrap again');
    wraps.of(this).value++;
    
    return function(){
      var ret;
      
      if(called) throw new Error('A wrap can only be called once');
      called = true;
      
      stack.push(self);
      
      try{ ret = f.apply(this,arguments); }
      catch(e){
        if(e instanceof assert.AssertionError) status.set(self,'fail');
        else status.set(self,'error');
        
        errors.push(e);
      }
      
      stack.pop();
      
      if(--wraps.of(self).value == 0 && tests.get(self) == 0) resolve(self);
      
      return ret;
    };
  }}
});

