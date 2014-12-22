var walk = require('vz.walk'),
    Yielded = require('vz.yielded'),
    
    print,
    process = global.process,
    code = 0,
    pending = [],
    test;

// Node

function Node(info){
  this.info = info;
  this.children = [];
  this.pending = 0;
  this.done = new Yielded();
  this.parent = null;
  this.error = null;
  this.t = null;
  this.t0 = null;
  this.t1 = null;
}

Node.prototype.setParent = function(parent){
  parent.children.push(this);
  parent.pending++;
  this.parent = parent;
}

Node.prototype.resolve = function(error){
  if(!error) return;
  if(this.error) return;
  
  code = 1;
  this.error = error;
  
  if(this.parent) this.parent.resolve(error);
}

Node.prototype.toString = function(){
  return this.info;
}

function getTime(){
  var now;
  
  if(process){
    now = process.hrtime();
    return now[0] * 1e3 + now[1] * 1e-6;
  }
  
  return performance.now();
}

Node.prototype.start = function(){
  pending.push(this);
  this.t0 = getTime();
};

Node.prototype.end = function(){
  var i = pending.indexOf(this);
  
  pending.splice(i,1);
  this.t1 = getTime();
  this.t = this.t1 - this.t0;
  
  if(this.parent){
    if(--this.parent.pending == 0) this.parent.done.done = true;
  }
};


module.exports = test = walk.wrap(function*(info,generator,args,thisArg){
  var node = new Node(info),
      ret,error,stack,i;
  
  stack = walk.getStack();
  for(i = stack.length - 1;i >= 0;i--) if(stack[i] instanceof Node){
    node.setParent(stack[i]);
    break;
  }
  
  node.start();
  
  try{ ret = yield walk(generator,args || [],thisArg || this,node); }
  catch(e){ error = e; }
  
  if(node.pending) yield node.done;
  
  node.end();
  
  node.resolve(error);
  
  if(!node.parent) print(node);
  
  return ret;
});

print = require('./main/print.js');

Object.defineProperty(test,'running',{get: function(){
  return pending.length > 0;
}});

if(process) process.on('exit',function(){
  var i,e,p;
  
  if(pending.length > 0){
    e = new Error('Unfinished test');
    
    p = pending.slice();
    for(i = 0;i < p.length;i++){
      if(!p[i].children.length){
        p[i].end(true);
        p[i].resolve(e);
        if(!p[i].parent) print(p[i]);
      }
    }
    
    p = pending.slice();
    for(i = 0;i < p.length;i++){
      p[i].end();
      p[i].resolve(e);
      if(!p[i].parent) print(p[i]);
    }
    
    print.check();
  }
  
  process.exit(code);
});

