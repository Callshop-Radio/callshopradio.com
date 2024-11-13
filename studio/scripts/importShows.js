const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    token: process.env.SANITY_STUDIO_IMPORT_TOKEN,
    useCdn: false,
    apiVersion: '2023-11-07'
});

const showsFilePath = path.join(__dirname, 'shows_test.json');

fs.readFile(showsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }
  
    try {
      const documents = JSON.parse(data);
  
      let transaction = client.transaction();
      documents.forEach(document => {
        document._id = uuidv4();
        transaction.createOrReplace(document);
      });
  
      transaction.commit()
        .then(result => {
          console.log('Data successfully imported:', result);
        })
        .catch(error => {
          console.error('Error importing data:', error);
        });
    } catch (parseError) {
      console.error('Error parsing the JSON file:', parseError);
    }
  });