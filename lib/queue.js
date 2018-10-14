const AliMNS = require('ali-mns');
const uuid = require('uuid');

module.exports = class Queue {
  constructor(config) {
    this.config = config;
    this.account = new AliMNS.Account(this.config.accountId, this.config.accessId, this.config.secretKey);
    this.regionSingapore = new AliMNS.Region(AliMNS.City.Singapore, AliMNS.NetworkType.Public);
    this.mq = new AliMNS.MQ(this.config.queueName, this.account, this.regionSingapore);
  }
    send(content) {
        for (const i in content) {
            content[i].info.random = uuid.v4();
            this.mq.sendP(JSON.stringify(content[i]));
        }
    }
}
