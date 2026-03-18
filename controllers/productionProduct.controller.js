const productionProductService = require('../services/productionProduct.service');
const ProductionProductModel = require('../models/ProductionProduct.model');

class ProductionProductController {
    async getAllProducts(req, res, next) {
        try {
            const products = await productionProductService.getAllProducts();
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await productionProductService.getProductById(id);

            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    error: "Product not found" 
                });
            }

            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req, res, next) {
        try {
            const validation = ProductionProductModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const result = await productionProductService.createProduct(req.body);
            res.status(201).json(result);
        } catch (error) {
            if (error.message === 'Product code already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;

            const { result, stats } = await productionProductService.updateProduct(id, req.body);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Product not found" 
                });
            }

            res.json({
                success: true,
                message: "Product updated successfully",
                modifiedCount: result.modifiedCount,
                stats
            });
        } catch (error) {
            if (error.message === 'Product code already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;

            const { result, stats } = await productionProductService.deleteProduct(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Product not found" 
                });
            }

            res.json({
                success: true,
                message: "Product deleted successfully",
                deletedCount: result.deletedCount,
                stats
            });
        } catch (error) {
            next(error);
        }
    }

    async getProductsByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const products = await productionProductService.getProductsByCategory(category);
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductsByStage(req, res, next) {
        try {
            const { stage } = req.params;
            const products = await productionProductService.getProductsByStage(stage);
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductsByStatus(req, res, next) {
        try {
            const { status } = req.params;
            const products = await productionProductService.getProductsByStatus(status);
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductsBySupervisor(req, res, next) {
        try {
            const { name } = req.params;
            const products = await productionProductService.getProductsBySupervisor(name);
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await productionProductService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async bulkUpdateStage(req, res, next) {
        try {
            const { productIds, productionStage } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: "Product IDs array is required" 
                });
            }

            const { result, stats } = await productionProductService.bulkUpdateStage(productIds, productionStage);

            res.json({
                success: true,
                message: "Bulk stage update completed",
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductionProductController();