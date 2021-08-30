const mongoose = require('mongoose');
const redis = require('redis');
const keys = require('../config/keys');

const redisClient = redis.createClient(keys.redisUrl);
const util = require('util');
redisClient.hget = util.promisify(redisClient.hget);

// This saves stores a reference to the original exec function
const exec = mongoose.Query.prototype.exec;

// Setamos aqui para conseguir deifnir quais rotas serao cacheadas ou nao quando formos fazer nossas querys
mongoose.Query.prototype.cache = function (options = {}) {
  //Esses nomes aqui podem ser o que vc quiser
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  const cacheValue = await redisClient.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    // The exec function expects to return mongoose documents or model instances
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // This will just continue the normal execution
  const result = await exec.apply(this, arguments);
  redisClient.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    // Foi usado o hashed key, por isso que a primeira chave vai ser apenas o id do usuario.s
    redisClient.del(JSON.stringify(hashKey || ''));
  },
};
