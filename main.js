var walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    print = require('./main/print.js'),
    process = global.process,
    stack = [],
    tests = new Yarr(),
    results = new Yarr();

function Node(info){
  this.info = info;
  this.children = [];
  this.parent = null;
  this.error = null;
  this.t = null;
  this.t0 = null;
  this.t1 = null;
}

Node.prototype.setParent = function(parent){
  parent.children.push(this);
  this.parent = parent;
}

Node.prototype.resolve = function(error){
  if(!error) return;
  if(this.error) return;
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
};

module.exports = function(info,generator){
  var node = new Node(info);
  
  function* test(){
    var error = null,ret;
    
    stack.push(node);
    
    node.start();
    try{ ret = yield walk(generator); }
    catch(e){ error = e; }
    node.end();
    
    node.resolve(error);
    
    stack.pop();
    
    if(stack.length == 0) print(node);
    
    return ret;
  }
  
  if(!stack.length){
    tests.push(test);
    return results.shift();
  }
  
  node.setParent(stack[stack.length - 1]);
  return walk(test);
};

// Execute

walk(function*(){
  var yd;
  
  while(true){
    yd = walk(yield tests.shift());
    yield results.push(yield yd);
  }
  
});

