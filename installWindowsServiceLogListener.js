var Service = require('node-windows').Service;
 
// Create a new service object
var svc = new Service({
  name:'isidor2',
  description: 'Arhiva isidor2',
  script: __dirname + '\\index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
  , workingDirectory: __dirname
});
 

svc.on('install',function(){
  svc.start();
});
 
svc.install();
