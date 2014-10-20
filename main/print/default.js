function getNL(syntax){
  switch(syntax){
    case 'html': return '<br>';
    default: return '\n';
  }
}

function red(txt,syntax){
  switch(syntax){
    case 'md': return txt;
    case 'html': return '<span style="color: red;">' + txt + '</span>';
    default: return '\x1B[31m' + txt + '\x1B[39m';
  }
}

function green(txt,syntax){
  switch(syntax){
    case 'md': return txt;
    case 'html': return '<span style="color: green;">' + txt + '</span>';
    default: return '\x1B[32m' + txt + '\x1B[39m';
  }
}

function getOk(options){
  return green('✓',options.syntax);
}

function getNok(options){
  return red('✗',options.syntax);
}

function getTime(node,options){
  if(options.showTime) return ' (' + node.t.toFixed(2) + 'ms' +')';
  return '';
}

function getCompleted(node,options){
  var ok = 0,i;
  
  if(!options.showCompleted) return '';
  if(!node.children.length) return '';
  if(!node.error) return '[' + node.children.length + '/' + node.children.length + '] ';
  
  for(i = 0;i < node.children.length;i++) if(!node.children[i].error) ok++;
  return '[' + ok + '/' + node.children.length + '] ';
}

function get(node,offset,options){
  var txt = offset,i;
  
  offset = ' ' + offset;
  txt += getCompleted(node,options) + node.info;
  
  if(!node.error){
    txt += ' ' + getOk(options) + getTime(node,options) + getNL(options.syntax);
    if(options.showDetails) for(i = 0;i < node.children.length;i++) txt += get(node.children[i],offset,options);
  }else{
    txt += ' ' + getNok(options) + getNL(options.syntax);
    
    if(node.children.length == 0){
      if(options.showErrors){
        txt += offset + 
          (node.error.stack?
          node.error.stack.replace(/\n/g,getNL(options.syntax) + offset):
          node.error)
           + getNL(options.syntax);
      }
    }else for(i = 0;i < node.children.length;i++) txt += get(node.children[i],offset,options);
  }
  
  return txt;
}

module.exports = function(tree,options){
  options = options || {};
  
  return get(tree,'',options);
};

