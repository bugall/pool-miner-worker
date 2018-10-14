'use strict';
const Stratum = require('stratum-pool');
const loggerFactory = require('./logger.js');

const ShareProcessor = require('./shareProcessor.js');
const logger = loggerFactory.getLogger('PoolWorker', 'system');
module.exports = class Pool {
  constructor(config) {
    this.config = config;
    this.pools = {};
    this.shareProcessor = new ShareProcessor(this.config);
    this.handlers = {
      auth: () => { },
      share: () => { },
      diff: () => { },
    };
    this.authorizeFN = (ip, port, workerName, password, callback) => {
      this.handlers.auth(port, workerName, password, authorized => {
        const authString = authorized ? 'Authorized' : 'Unauthorized ';
        logger.debug('%s %s:%s [%s]', authString, workerName, password, ip);
        callback({
          error: null,
          authorized,
          disconnect: false,
        });
      });
    };
    this.pool = Stratum.createPool(this.config, this.authorizeFN, logger);
  }

  setDifficultyForProxyPort(pool, coin, algo) {
    logger.debug(`[${algo}] Setting proxy difficulties after pool start`);
    Object.keys(this.config.switching).forEach(switchName => {
      if (!this.config.switching[switchName].enabled) {
        return;
      }

      const switchAlgo = this.config.switching[switchName].algorithm;
      if (pool.options.coin.algorithm !== switchAlgo) {
        return;
      }
      for (const port in this.config.switching[switchName].ports) {

        if (this.config.switching[switchName].ports[port].varDiff) {
          pool.setVarDiff(port, this.config.switching[switchName].ports[port].varDiff);
        }

        if (this.config.switching[switchName].ports[port].diff) {
          if (!pool.options.ports.hasOwnProperty(port)) {
            pool.options.ports[port] = {};
          }
          pool.options.ports[port].diff = this.config.switching[switchName].ports[port].diff;
        }
      }
    });
  }

  init() {
    this.handlers.auth = (port, workerName, password, authCallback) => {
      if (!this.config.validateWorkerUsername) {
        authCallback(true);
      } else {
        try {
          // tests address.worker syntax
          const re = /^(?:[a-zA-Z0-9]+\.)*[a-zA-Z0-9]+$/;
          if (re.test(workerName)) {
            // not valid input, does not respect address.worker scheme. Acceptable chars a a-Z and 0-9
            if (workerName.indexOf('.') !== -1) {
              const tmp = workerName.split('.');
              if (tmp.length !== 2) {
                authCallback(false);
              } else {
                this.pool.daemon.cmd('validateaddress', [ tmp[0] ], results => {
                  const isValid = results.filter(r => {
                    return r.response.isvalid;
                  }).length > 0;
                  authCallback(isValid);
                });
              }
            } else {
              this.pool.daemon.cmd('validateaddress', [ workerName ], results => {
                const isValid = results.filter(r => {
                  return r.response.isvalid;
                }).length > 0;
                authCallback(isValid);
              });
            }
          } else {
            authCallback(false);
          }
        } catch (e) {
          authCallback(false);
        }
      }
    };

    this.handlers.share = (isValidShare, isValidBlock, data) => {
      logger.silly('Handle share, execeuting shareProcessor.handleShare, isValidShare = %s, isValidBlock = %s, data = %s', isValidShare, isValidBlock, JSON.stringify(data));
      this.shareProcessor.handleShare(isValidShare, isValidBlock, data);
    };
  }

  start() {
    this.init();
    this.pool.on('share', (isValidShare, isValidBlock, data) => {
      const shareDataJsonStr = JSON.stringify(data);
      if (data.blockHash && !isValidBlock) {
        logger.info('We thought a block was found but it was rejected by the daemon, share data: %s' + shareDataJsonStr);
      } else if (isValidBlock) {
        logger.info('Block found: %s', data.blockHash + ' by %s', data.worker);
      }
      if (isValidShare) {
        if (data.shareDiff > 1000000000) {
          logger.warn('Share was found with diff higher than 1.000.000.000!');
        } else if (data.shareDiff > 1000000) {
          logger.warn('Share was found with diff higher than 1.000.000!');
        }
        logger.info('Share accepted at diff %s/%s by %s [%s]', data.difficulty, data.shareDiff, data.worker, data.ip);

      } else if (!isValidShare) {
        logger.info('Share rejected: ' + shareDataJsonStr);
      }
      this.handlers.share(isValidShare, isValidBlock, data);

    }).on('difficultyUpdate', (workerName, diff) => {
      logger.info('Difficulty update to diff %s workerName = %s', JSON.stringify(workerName));
      this.handlers.diff(workerName, diff);
    }).on('log', (severity, text) => {
      logger.info(text);
    }).on('banIP', ip => {
      process.send({ type: 'banIP', ip });
    }).on('started', () => {
      this.setDifficultyForProxyPort(this.pool, this.config.coin.name, this.config.coin.algorithm);
    });
    this.pool.start();
    this.pools[this.config.coin.name] = this.pool;
  }
}
