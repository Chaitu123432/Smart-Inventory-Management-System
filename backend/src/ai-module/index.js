const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const pythonPath = path.join(__dirname, 'python');
const pythonScriptPath = path.join(pythonPath, 'forecast.py');
const modelsPath = path.join(pythonPath, 'models');

fs.mkdirSync(modelsPath, { recursive: true });

function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args]);
    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      }
    });
  });
}

function execPythonFunction(functionName, args = {}) {
  const tmpFile = path.join(pythonPath, `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(args));

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['-c', `
import json
import sys
from forecast import ${functionName}

with open('${tmpFile}', 'r') as f:
  args = json.load(f)

result = ${functionName}(**args)
print(json.dumps(result))
sys.stdout.flush()
`]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {}

      if (code !== 0) {
        logger.error(`Python function ${functionName} failed: ${stderr}`);
        reject(new Error(`Python function ${functionName} failed: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          logger.error(`Failed to parse Python output: ${stdout}`);
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      }
    });
  });
}

async function predictSales(productId, period = 30, modelType = 'ensemble') {
  try {
    const result = await execPythonFunction('predict_sales', {
      product_id: productId,
      days: period
    });
    return result;
  } catch (error) {
    logger.error(`Failed to predict sales: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

async function generateForecast(productId, salesData, options = {}) {
  try {
    const { period = 30, model = 'ensemble' } = options;
    let result;
    
    if (model === 'ensemble') {
      result = await execPythonFunction('ensemble_forecast', {
        product_id: productId,
        sales_data: salesData,
        days: period
      });
    } else if (model === 'arima') {
      result = await execPythonFunction('arima_forecast', {
        product_id: productId,
        sales_data: salesData,
        days: period
      });
    } else {
      await execPythonFunction('train_model', {
        product_id: productId,
        sales_data: salesData
      });
      
      result = await execPythonFunction('predict_sales', {
        product_id: productId,
        days: period
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to generate forecast: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

async function optimizeInventory(products, forecastResults) {
  try {
    const result = await execPythonFunction('optimize_inventory', {
      product_data: products,
      forecast_data: forecastResults
    });
    return result;
  } catch (error) {
    logger.error(`Failed to optimize inventory: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

async function detectAnomalies(transactionData, threshold = 3) {
  try {
    const result = await execPythonFunction('detect_anomalies', {
      transaction_data: transactionData,
      threshold
    });
    return result;
  } catch (error) {
    logger.error(`Failed to detect anomalies: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

async function trainModel(productId, salesData) {
  try {
    const result = await execPythonFunction('train_model', {
      product_id: productId,
      sales_data: salesData
    });
    return result;
  } catch (error) {
    logger.error(`Failed to train model: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

module.exports = {
  predictSales,
  generateForecast,
  optimizeInventory,
  detectAnomalies,
  trainModel
}; 