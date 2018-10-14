module.exports = {
    blockRefreshInterval: 1000,
    jobRebroadcastTimeout: 55,
    connectionTimeout: 600,
    emitInvalidBlockHashes: false,
    validateWorkerUsername: true,
    tcpProxyProtocol: false,
    banning: {
      enabled: true,
      time: 600,
      invalidPercent: 50,
      checkThreshold: 500,
      purgeInterval: 300,
    },
    address: '',
    ports: {
      1234: {
        diff: 0.05,
      },
    },
    daemons: [{
      host: '',
      port: '',
      user: '',
      password: '',
    }],
    coin: {
      name: 'IDA',
      symbol: 'IDA',
      algorithm: 'x16r',
    },
    redis: {
      host: '172.17.0.5',
      port: 6378,
    },
    queue: {
      accountId: '',
      accessId: '',
      secretKey: '',
      queueName: '',
    },
    mysql: {
      
    },
    switching: {
      switch1: {
        enabled: false,
        algorithm: 'sha256',
        ports: {
          3333: {
            diff: 10,
            varDiff: {
              minDiff: 16,
              maxDiff: 512,
              targetTime: 15,
              retargetTime: 90,
              variancePercent: 30
            }
          }
        }
      },
    }
  };
  