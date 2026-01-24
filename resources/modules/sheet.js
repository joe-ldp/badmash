require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

googleAuth = (client) => {
    const google = require.main.require('./resources/keys/google.json');

    // Set credentials
    google.private_key_id = process.env.GOOGLE_PRIVATE_KEY_ID;
    google.private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    client.google = google;
}

getMcatalogSheet = async (google) => {
    const doc = new GoogleSpreadsheet(process.env.SHEET_KEY);
    await doc.useServiceAccountAuth(google);
    await doc.loadInfo();
    
    return doc.sheetsByTitle['Main Catalog'];
}

module.exports = {
    googleAuth,
    getMcatalogSheet,
}