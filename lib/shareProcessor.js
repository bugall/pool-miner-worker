'use strict';
const loggerFactory = require('./logger.js');
const logger = loggerFactory.getLogger('ShareProcessor', 'system');
const Queue = require('./queue');

module.exports = class ShareProcessor {
  constructor(poolConfig) {
    this.coin = poolConfig.coin.name;
    this.queue = new Queue(poolConfig.queue);
  }

    handleShare(isValidShare, isValidBlock, shareData) {
        const queueContents = [];
        if (isValidShare) {
            queueContents.push({
                version: 1,
                action: 'isValidShare',
                info: {
                    coin: this.coin,
                    worker: shareData.worker,
                    diff: shareData.difficulty,
                    height: shareData.height
                }
            })
        } else {
            queueContents.push({
                version: 1,
                action: 'invalidShares',
                info: {
                    coin: coin,
                    worker: shareData.worker,
                    diff: shareData.difficulty,
                    height: shareData.height
                }
            })
        }
        if (isValidBlock) {
            queueContents.push({
                version: 1,
                action: 'isValidBlock',
                info: {
                    coin: this.coin,
                    height: shareData.height,
                    hash: shareData.blockHash,
                    txHash: shareData.txHash,
                    worker: shareData.worker
                }
            })
            // queueContents.push([ 'rename', this.coin + ':shares:roundCurrent', this.coin + ':shares:round' + shareData.height ]);
            // queueContents.push([ 'sadd', this.coin + ':blocksPending', [ shareData.blockHash, shareData.txHash, shareData.height ].join(':') ]);
            // queueContents.push([ 'hincrby', this.coin + ':stats', 'validBlocks', 1 ]);
        } else if (shareData.blockHash) {
            queueContents.push({
                version: 1,
                action: 'invalidBlock',
                info: {
                    coin: this.coin,
                    height: shareData.height,
                    hash: shareData.blockHash,
                    txHash: shareData.txHash,
                    worker: shareData.worker
                }
            })
        }
        this.queue.send(queueContents);
  }
};
