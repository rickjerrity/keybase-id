const axios = require('axios');

async function fetch(url) {
  let data;
  const response = await axios.get(url);

  if (response.data) {
    data = response.data;
  }

  return data;
}

module.exports = fetch;
