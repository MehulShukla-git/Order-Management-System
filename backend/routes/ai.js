const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Get ML Metrics
router.get('/insights', (req, res) => {
  try {
    const metricsPath = path.resolve(__dirname, '../../ml/models/metrics.json');
    let metrics = { MAE: 0, RMSE: 0, R2: 0 };
    if (fs.existsSync(metricsPath)) {
      metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    }

    const predictScript = path.resolve(__dirname, '../../ml/predict.py');
    const pythonExecutable = os.platform() === 'win32' ? 'python' : 'python3';
    
    exec(`${pythonExecutable} "${predictScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running python script:', stderr);
        return res.status(500).json({ success: false, message: 'Failed to run prediction model', error: stderr });
      }
      
      try {
        const insights = JSON.parse(stdout);
        res.json({ success: true, data: { metrics, insights } });
      } catch (parseErr) {
        console.error('Error parsing python output:', stdout);
        res.status(500).json({ success: false, message: 'Invalid prediction output format' });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
