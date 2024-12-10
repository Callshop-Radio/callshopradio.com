const fs = require('fs')
const path = require('path')
const {v4: uuidv4} = require('uuid')
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_STUDIO_IMPORT_TOKEN,
  useCdn: false,
  apiVersion: '2023-11-07',
})

const filePath = path.join(__dirname, 'artists.txt')

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s]+/g, '-')
}

// Hauptfunktion, um die .txt-Datei zu lesen und zu importieren
fs.readFile(filePath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading the file:', err)
    return
  }

  try {
    // Jede Zeile der Datei in ein Array aufteilen und leere Zeilen entfernen
    const lines = data
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)

    const documents = lines.map((line) => {
      // ID für den Datensatz erstellen
      const id = uuidv4()
      // Slug generieren aus der entsprechenden Zeile der Datei
      const slug = generateSlug(line)

      return {
        _id: id,
        _type: 'person', // Standard-Dokumenttyp
        title: line,
        slug: {
          _type: 'slug',
          current: slug,
        },
        tags: [
          {
            _type: 'tag',
            _key: '9057068f2977',
            _ref: 'c86b2078-56a4-4281-b2aa-f73c786a7099',
          },
        ],
      }
    })

    // Transaktion aufbauen und alle Dokumente importieren
    let transaction = client.transaction()
    documents.forEach((document) => {
      transaction.createOrReplace(document)
    })

    transaction
      .commit()
      .then((result) => {
        console.log('Data successfully imported:', result)
      })
      .catch((error) => {
        console.error('Error importing data:', error)
      })
  } catch (parseError) {
    console.error('Error processing the file:', parseError)
  }
})
