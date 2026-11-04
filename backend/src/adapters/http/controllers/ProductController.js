class ProductController {
  constructor(productUseCases) {
    this.productUseCases = productUseCases;
  }

  getAll = async (req, res, next) => {
    try {
      const { category, search, sortBy, minPrice, maxPrice, size, color, inStock } = req.query;
      const products = await this.productUseCases.getAllProducts({ category, search, sortBy, minPrice, maxPrice, size, color, inStock });
      res.json(products);
    } catch (err) { next(err); }
  };

  getFilterOptions = async (req, res, next) => {
    try {
      res.json(await this.productUseCases.getFilterOptions());
    } catch (err) { next(err); }
  };

  getById = async (req, res, next) => {
    try {
      const product = await this.productUseCases.getProductById(req.params.id);
      res.json(product);
    } catch (err) { next(err); }
  };

  getTrending = async (req, res, next) => {
    try {
      const products = await this.productUseCases.getTrending(10);
      res.json(products);
    } catch (err) { next(err); }
  };

  getNewArrivals = async (req, res, next) => {
    try {
      const products = await this.productUseCases.getNewArrivals(6);
      res.json(products);
    } catch (err) { next(err); }
  };

  search = async (req, res, next) => {
    try {
      const { q } = req.query;
      const products = await this.productUseCases.searchProducts(q);
      res.json(products);
    } catch (err) { next(err); }
  };

  create = async (req, res, next) => {
    try {
      const product = await this.productUseCases.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) { next(err); }
  };
}

module.exports = ProductController;
