import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export class HuggingFaceService {
  // Sales forecasting using Prophet model
  static async predictSales(historicalData: any[]) {
    try {
      const response = await hf.textGeneration({
        model: 'facebook/prophet',
        inputs: JSON.stringify(historicalData),
        parameters: {
          max_length: 100,
          temperature: 0.7,
        },
      });
      return JSON.parse(response.generated_text);
    } catch (error) {
      console.error('Error in sales prediction:', error);
      throw error;
    }
  }

  // Product categorization
  static async categorizeProduct(description: string) {
    try {
      const response = await hf.textClassification({
        model: 'distilbert-base-uncased',
        inputs: description,
      });
      return response;
    } catch (error) {
      console.error('Error in product categorization:', error);
      throw error;
    }
  }

  // Sentiment analysis of customer feedback
  static async analyzeSentiment(text: string) {
    try {
      const response = await hf.textClassification({
        model: 'nlptown/bert-base-multilingual-uncased-sentiment',
        inputs: text,
      });
      return response;
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      throw error;
    }
  }

  // Advanced demand forecasting
  static async forecastDemand(historicalData: any[]) {
    try {
      const response = await hf.textGeneration({
        model: 'microsoft/forecast-t5-base',
        inputs: JSON.stringify(historicalData),
        parameters: {
          max_length: 100,
          temperature: 0.7,
        },
      });
      return JSON.parse(response.generated_text);
    } catch (error) {
      console.error('Error in demand forecasting:', error);
      throw error;
    }
  }
} 