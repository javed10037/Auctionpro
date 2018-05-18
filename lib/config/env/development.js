module.exports = {
    environment: 'development',
    ip: 'localhost',
    port: 4009,
    protocol : 'http',
    TAG: "development",
    mongo: {
        dbName: 'exchanges',
        dbUrl: "mongodb://localhost:27017/",
        options: {
            user: "",
            pass: "",
            server: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}},
            replset: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
        }
    },
    iamUser : {
        accessKey : 'zS9da31x9+Kw+i0flTFpxC5cE1zEWH9uHroDrZVF',
        keyId : 'AKIAJ6L3U7P5W2LTLGQQ',
    },
    // option parameters constantys for s3
    isDev:true

    //Form Dynamic Values Depending on ENV
   
}
