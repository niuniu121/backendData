const axios = require('axios');

axios.get("https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bays/records?limit=10")
    .then(res => {
        console.log('SUCCESS:', res.data.results[0]);
    })
    .catch(err => {
        console.error('ERROR:', err.message);
    });
