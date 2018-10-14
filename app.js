const Worker = require('./lib');
const config = require('./config');
const worker = new Worker(config);
worker.start();
