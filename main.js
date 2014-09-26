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
    text = new Property(),
    
    container,
    subcontainer;

function getNL(insideList){
  switch(Test.syntax){
    case 'md': return '  \n';
    case 'console': return '\n';
    case 'html': return insideList?'\n':'<br>\n';
  }
}

function red(txt){
  switch(Test.syntax){
    case 'md': return txt;
    case 'console': return '\x1B[31m' + txt + '\x1B[39m';
    case 'html': return '<span style="color: red;">' + txt + '</span>';
  }
}

function green(txt){
  switch(Test.syntax){
    case 'md': return txt;
    case 'console': return '\x1B[32m' + txt + '\x1B[39m';
    case 'html': return '<span style="color: green;">' + txt + '</span>';
  }
}

function output(txt,insideList){
  var frag;
  
  switch(Test.output){
    case 'std':
      proc.stdout.write(txt + getNL(insideList));
      break;
    case 'browser':
      
      if(!container){
        container = document.createElement('div');
        container.style.fontFamily = 'monospace';
        document.body.appendChild(container);
        subcontainer = document.createElement('div');
        container.appendChild(subcontainer);
      }
      
      frag = document.createElement('span');
      frag.innerHTML = txt + getNL(insideList);
      subcontainer.appendChild(frag);
  }
}

function print(test,offset){
  var ret = '',
      notOk = test.status != 'pass',
      c = children.get(test),
      time,
      i;
  
  ret += offset;
  if(Test.syntax == 'html') ret += '<ul><li style="font-family: monospace;list-style-type: none;">';
  if(Test.numbers && c.length) ret += '[' + ok.get(test) + '/' + c.length + ']';
  ret += ' ' + text.get(test);
  
  switch(Test.status){
    case 'gfm':
      ret += ' ' + (notOk?':heavy_multiplication_x:':':heavy_check_mark:');
      break;
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
  
  if(Test.syntax == 'html') ret += '</li>';
  
  offset = (Test.syntax == 'md'?'    ':'  ') + offset;
  
  switch(Test.mode){
    case 'details':
      for(i = 0;i < c.length;i++) ret += getNL(true) + print(c[i],offset);
      break;
      
    case 'errors':
      if(notOk){
        for(i = 0;i < c.length;i++){
          if(c[i].status != 'pass') ret += getNL(true) + print(c[i],offset);
        }
      }
      break;
      
    default:
      if(notOk){
        for(i = 0;i < c.length;i++) ret += getNL(true) + print(c[i],offset);
      }
  }
  
  if(Test.syntax == 'html') ret += '</ul>';
  
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
  
  output(print(test,Test.syntax == 'md'?'- ':''),true);
}

module.exports = Test = function(txt,callback){
  
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
  
  if(callback) this.wrap(callback)(this);
};

var units = [
  'B',
  'kiB',
  'MiB',
  'GiB',
  'TiB',
	'PiB',
	'EiB',
	'ZiB',
	'YiB'
  ];

function getRAM(os){
  var step = 0,
      size = os.totalmem(),
      i = 0;
  
  while(size > 1024 && i < units.length){
		size /= 1024;
		i++;
	}
  
  size = size.toFixed(2);
  
	while(size.charAt(size.length - 1) == '0') size = size.substring(0,size.length - 1);
	if(size.charAt(size.length - 1) == '.') size = size.substring(0,size.length - 1);
  
  return size + units[i];
}

Test.printInfo = function(){
  var os;
  
  if(proc){
    os = require('os');
    output(os.type() + ' ' + os.release() + ' ' + os.arch());
    output(os.cpus()[0].model);
    output(getRAM(os) + ' RAM');
    output('');
  }else{
    output(navigator.userAgent.replace(/(\s\w+\/)/g,getNL() + '$1'));
    output('');
  }
  
};

Test.run = function(test){
  var temp,
      cont,
      errors,
      mode,
      end,
      run;
  
  if(!proc){
    cont = document.createElement('div');
    document.body.appendChild(cont);
    
    errors = document.createElement('input');
    errors.type = 'checkbox';
    
    mode = document.createElement('select');
    mode.innerHTML =  '<option value="default">default</option>' + 
                      '<option value="errors">Show only failed tests</option>' + 
                      '<option value="details">Show all tests</option>';
    
    run = document.createElement('input');
    run.type = 'button';
    run.value = 'Run test';
    
    end = document.createElement('a');
    end.textContent = 'End test';
    
    end.onclick = function(){
      end.remove();
      showErrors();
    }
    
    end.href = 'javascript:void(0);';
    
    run.onclick = function(){
      cont.remove();
      
      Test.errors = errors.checked;
      Test.mode = mode.value;
      
      Test.printInfo();
      test();
      
      document.body.appendChild(document.createElement('br'));
      document.body.appendChild(end);
    };
    
    temp = document.createElement('span');
    temp.innerHTML = 'Mode: ';
    cont.appendChild(temp);
    cont.appendChild(mode);
    cont.appendChild(document.createElement('br'));
    
    cont.appendChild(errors);
    temp = document.createElement('span');
    temp.innerHTML = 'Show errors<br>';
    cont.appendChild(temp);
    
    cont.appendChild(document.createElement('br'));
    cont.appendChild(run);
    
    return;
  }
  
  Test.printInfo();
  test();
};

function showErrors(){
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
    
    ret = ret.replace(/\n/g,getNL());
    if(Test.syntax == 'html') ret = ret.replace(/\s/g,'&nbsp;');
    
    output(ret);
  }
}

if(proc){
  
  Test.output = proc.env.output || 'std';
  Test.times = proc.env.times?(proc.env.times == 'true'?true:false):true;
  Test.numbers = proc.env.numbers?(proc.env.numbers == 'true'?true:false):true;
  Test.errors = proc.env.errors?(proc.env.errors == 'true'?true:false):false;
  Test.precision = proc.env.precision || '2';
  Test.mode = proc.env.mode || 'default';
  Test.status = proc.env.status || 'tick';
  Test.syntax = proc.env.syntax || 'console';
  
  proc.on('exit',showErrors);
  
}else{
  
  Test.output = 'browser';
  Test.times = true;
  Test.numbers = true;
  Test.errors = false;
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
      
      if(resolved.get(self)) return;
      
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

