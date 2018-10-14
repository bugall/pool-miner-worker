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
                action: 'isValidShare',
                info: {
                    coin: this.coin,
                    worker: shareData.worker,
                    diff: shareData.difficulty,
                }
            })
        } else {
            queueContents.push({
                action: 'invalidShares',
                info: {
                    coin: coin,
                    type: 'invalidShares',
                    number: 1,
                }
            })
        }
        if (isValidBlock) {
            queueContents.push({
                action: 'isValidBlock',
                info: {
                    coin: coin,
                    height: shareData.height,
                    hash: shareData.blockHash,
                    txHash: shareData.txHash,
                }
            })
            // queueContents.push([ 'rename', this.coin + ':shares:roundCurrent', this.coin + ':shares:round' + shareData.height ]);
            // queueContents.push([ 'sadd', this.coin + ':blocksPending', [ shareData.blockHash, shareData.txHash, shareData.height ].join(':') ]);
            // queueContents.push([ 'hincrby', this.coin + ':stats', 'validBlocks', 1 ]);
        } else if (shareData.blockHash) {
            queueContents.push({
                action: this.coin + ':invalidBlock',
                info: {
                    height: shareData.height,
                    hash: shareData.blockHash,
                    txHash: shareData.txHash,
                }
            })
        }
        this.queue.send(queueContents);
  }
};
