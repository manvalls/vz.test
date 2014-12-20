var walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    Yielded = require('vz.yielded'),
    
    print = require('./main/print.js'),
    process = global.process,
    code = 0,
    test,
    stack = [];

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

function getTime(){
  var now;
  
  if(process){
    now = process.hrtime();
    return now[0] * 1e3 + now[1] * 1e-6;
  }
  
  return performance.now();
}

Node.prototype.start = function(){
  this.t0 = getTime();
};

Node.prototype.end = function(){
  this.t1 = getTime();
  this.t = this.t1 - this.t0;
  
  if(this.parent){
    if(--this.parent.pending == 0) this.parent.done.done = true;
  }
};


function before(node){
  stack.push(node);
}

function after(){
  stack.pop();
}

module.exports = test = walk.wrap(function*(info,generator,args,thisArg){
  var node = new Node(info),
      ret,error;
  
  if(stack.length) node.setParent(stack[stack.length - 1]);
  
  node.start();
  
  try{
    ret = yield walk(generator,args || [],thisArg || this,{
      before: before,
      after: after,
      id: node
    });
  }catch(e){ error = e; }
  
  if(node.pending) yield node.done;
  
  node.end();
  
  node.resolve(error);
  
  if(!node.parent) print(node);
  
  return ret;
});

if(process) process.on('exit',function(){
  process.exit(code);
});

