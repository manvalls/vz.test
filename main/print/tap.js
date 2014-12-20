var seq = 0;

module.exports = function(tree,options){
  var msg;
  
  if(tree.error) msg = 'not ok ' + ++seq;
  else msg = 'ok ' + ++seq;
  msg += ' - ' + tree.info + '\n';
  
  return msg;
};

module.exports.before = function(){
  return 'TAP version 13\n'
};

module.exports.after = function(){
  return '1..' + seq + '\n';
};

