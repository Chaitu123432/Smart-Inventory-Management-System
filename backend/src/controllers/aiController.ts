import { Request, Response } from 'express';
import { HuggingFaceService } from '../services/huggingFaceService';
import pool from '../config/database';

export const aiController = {
  // Generate sales forecast
  async generateForecast(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      
      // Get historical sales data
      const result = await pool.query(
        'SELECT date, quantity FROM sales WHERE product_id = $1 ORDER BY date',
        [productId]
      );
      
      const forecast = await HuggingFaceService.predictSales(result.rows);
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: 'Error generating forecast' });
    }
  },

  // Categorize product
  async categorizeProduct(req: Request, res: Response) {
    try {
      const { description } = req.body;
      const categories = await HuggingFaceService.categorizeProduct(description);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Error categorizing product' });
    }
  },

  // Analyze customer feedback
  async analyzeFeedback(req: Request, res: Response) {
    try {
      const { feedback } = req.body;
      const sentiment = await HuggingFaceService.analyzeSentiment(feedback);
      res.json(sentiment);
    } catch (error) {
      res.status(500).json({ error: 'Error analyzing feedback' });
    }
  },

  // Generate demand forecast
  async generateDemandForecast(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      
      // Get historical data
      const result = await pool.query(
        'SELECT date, quantity, price FROM sales WHERE product_id = $1 ORDER BY date',
        [productId]
      );
      
      const forecast = await HuggingFaceService.forecastDemand(result.rows);
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: 'Error generating demand forecast' });
    }
  }
}; 