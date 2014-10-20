var _default = require('./print/default.js'),
    process = global.process,
    trees = [],
    options,
    container,
    subcontainer;

if(process) options = {
  showErrors: process.env.showErrors == 'true' || 'e' in process.env,
  showDetails: process.env.showDetails == 'true' || 'd' in process.env,
  showCompleted: process.env.showCompleted == 'true' || 'c' in process.env,
  showTime: process.env.showTime == 'true' || 't' in process.env,
  syntax: process.env.syntax || process.env.s || 'console',
  indicator: process.env.indicator || process.env.i || 'tick'
};
else (function(){
  var errorsButton,
      detailsButton,
      timeButton,
      completedButton;
  
  options = {
    showErrors: false,
    showDetails: false,
    showCompleted: false,
    syntax: 'html',
    indicator: 'tick'
  };
  
  container = document.createElement('div');
  subcontainer = document.createElement('div');
  
  subcontainer.style.whiteSpace = 'pre';
  subcontainer.style.fontFamily = 'monospace';
  
  container.appendChild(subcontainer);
  container.appendChild(document.createElement('br'));
  
  errorsButton = document.createElement('input');
  errorsButton.type = 'checkbox';
  errorsButton.onclick = function(){
    options.showErrors = this.checked;
    show();
  };
  
  container.appendChild(errorsButton);
  container.appendChild(document.createTextNode('Errors'));
  container.appendChild(document.createElement('br'));
  
  detailsButton = document.createElement('input');
  detailsButton.type = 'checkbox';
  detailsButton.onclick = function(){
    options.showDetails = this.checked;
    show();
  };
  
  container.appendChild(detailsButton);
  container.appendChild(document.createTextNode('Details'));
  container.appendChild(document.createElement('br'));
  
  timeButton = document.createElement('input');
  timeButton.type = 'checkbox';
  timeButton.onclick = function(){
    options.showTime = this.checked;
    show();
  };
  
  container.appendChild(timeButton);
  container.appendChild(document.createTextNode('Elapsed time'));
  container.appendChild(document.createElement('br'));
  
  completedButton = document.createElement('input');
  completedButton.type = 'checkbox';
  completedButton.onclick = function(){
    options.showCompleted = this.checked;
    show();
  };
  
  container.appendChild(completedButton);
  container.appendChild(document.createTextNode('Number of completed tests'));
  container.appendChild(document.createElement('br'));
  
  document.body.appendChild(container);
})();

function show(){
  subcontainer.innerHTML = '';
  
  for(i = 0;i < trees.length;i++){
    subcontainer.innerHTML += _default(trees[i],options);
  }
}

module.exports = function(tree){
  var i;
  
  if(process) process.stdout.write(_default(tree,options));
  else{
    trees.push(tree);
    show();
  }
};

