const axios = require('axios');

const testGen = async () => {
  try {
    console.log('Testing Report Generation...');
    const res = await axios.post('http://localhost:5000/api/reports/generate', {
      type: 'Monthly',
      month: 'February',
      year: 2026
    });
    console.log('Result:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error Status:', err.response.status);
      console.error('Error Data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
};

testGen();
