const { Product } = require('./models');

(async () => {
  const count = await Product.count();
  console.log('Total products in DB:', count);
  const sample = await Product.findAll({ limit: 5 });
  console.log(JSON.stringify(sample, null, 2));
})();
