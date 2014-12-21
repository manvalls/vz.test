var seq;

module.exports = function(tree,options){
  var msg;
  
  if(tree.error) msg = 'not ok ' + ++seq;
  else msg = 'ok ' + ++seq;
  msg += ' - ' + tree.info + '\n';
  
  return msg;
};

module.exports.before = function(){
  seq = 0;
  return 'TAP version 13\n'
};

module.exports.after = function(){
  return '1..' + seq + '\n';
};

