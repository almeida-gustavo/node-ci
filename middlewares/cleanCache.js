const { clearHash } = require('../services/cache');

// Esse await next() eh um truque para que vc consiga chamar o middleware apos a execucao de todo o codigo.
module.exports = async (req, res, next) => {
  await next();

  clearHash(req.user.id);
};
