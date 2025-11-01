require('dotenv').config();
const { HfInference } = require('@huggingface/inference');
const logger = require('../utils/logger');

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

class HuggingFaceService {
  /**
   * Sales forecasting using HuggingFace models
   * Note: For Prophet, you'll need to use Python. This uses time-series models available on HF.
   */
  static async predictSales(historicalData) {
    try {
      if (!process.env.HUGGING_FACE_API_KEY) {
        throw new Error('HUGGING_FACE_API_KEY is not set in environment variables');
      }

      // Format data for HuggingFace
      const formattedData = historicalData.map(d => ({
        date: d.date || d.transactionDate,
        value: d.quantity || d.value
      }));

      // Use a time-series forecasting model
      // Note: Prophet isn't directly available via HF API, using alternative
      const response = await hf.textGeneration({
        model: 'microsoft/forecast-t5-base',
        inputs: JSON.stringify({
          historical_data: formattedData,
          forecast_horizon: 30
        }),
        parameters: {
          max_length: 200,
          temperature: 0.7,
        },
      });

      let forecast;
      try {
        forecast = JSON.parse(response.generated_text);
      } catch (e) {
        // If response is not JSON, create a structured response
        forecast = {
          predictions: response.generated_text.split(',').map(v => parseFloat(v.trim()) || 0),
          model: 'forecast-t5-base'
        };
      }

      return forecast;
    } catch (error) {
      logger.error('Error in sales prediction with HuggingFace:', error);
      throw error;
    }
  }

  /**
   * Product categorization using DistilBERT
   */
  static async categorizeProduct(description) {
    try {
      if (!process.env.HUGGING_FACE_API_KEY) {
        throw new Error('HUGGING_FACE_API_KEY is not set in environment variables');
      }

      const response = await hf.textClassification({
        model: 'distilbert-base-uncased-finetuned-sst-2-english',
        inputs: description,
      });

      return {
        category: response[0]?.label || 'unknown',
        confidence: response[0]?.score || 0,
        model: 'distilbert-base-uncased'
      };
    } catch (error) {
      logger.error('Error in product categorization:', error);
      throw error;
    }
  }

  /**
   * Sentiment analysis of customer feedback
   */
  static async analyzeSentiment(text) {
    try {
      if (!process.env.HUGGING_FACE_API_KEY) {
        throw new Error('HUGGING_FACE_API_KEY is not set in environment variables');
      }

      const response = await hf.textClassification({
        model: 'nlptown/bert-base-multilingual-uncased-sentiment',
        inputs: text,
      });

      return {
        sentiment: response[0]?.label || 'neutral',
        score: response[0]?.score || 0,
        model: 'bert-multilingual-sentiment'
      };
    } catch (error) {
      logger.error('Error in sentiment analysis:', error);
      throw error;
    }
  }

  /**
   * Advanced demand forecasting using T5 model
   */
  static async forecastDemand(historicalData, period = 30) {
    try {
      if (!process.env.HUGGING_FACE_API_KEY) {
        throw new Error('HUGGING_FACE_API_KEY is not set in environment variables');
      }

      // Format historical data
      const dataString = JSON.stringify(historicalData);

      const response = await hf.textGeneration({
        model: 'microsoft/forecast-t5-base',
        inputs: `Forecast next ${period} days: ${dataString}`,
        parameters: {
          max_length: 300,
          temperature: 0.5,
        },
      });

      let forecast;
      try {
        forecast = JSON.parse(response.generated_text);
      } catch (e) {
        // Parse as structured forecast
        const predictions = response.generated_text
          .replace(/[\[\]]/g, '')
          .split(',')
          .map(v => Math.max(0, parseFloat(v.trim()) || 0));

        forecast = {
          predictions: predictions.slice(0, period),
          total_demand: predictions.reduce((a, b) => a + b, 0),
          average_daily_demand: predictions.reduce((a, b) => a + b, 0) / predictions.length,
          model: 'forecast-t5-base',
          period: period
        };
      }

      return forecast;
    } catch (error) {
      logger.error('Error in demand forecasting:', error);
      throw error;
    }
  }

  /**
   * Check if HuggingFace API is configured
   */
  static isConfigured() {
    return !!process.env.HUGGING_FACE_API_KEY;
  }
}

module.exports = HuggingFaceService;