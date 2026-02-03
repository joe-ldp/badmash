require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

googleAuth = () => {
    const google = require.main.require('./resources/keys/google.json');

    // Set credentials
    google.private_key_id = process.env.GOOGLE_PRIVATE_KEY_ID;
    google.private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    return google;
}

getMcatalogSheet = async () => {
    const doc = new GoogleSpreadsheet(process.env.SHEET_KEY);
    await doc.useServiceAccountAuth(googleAuth());
    await doc.loadInfo();
    
    return doc.sheetsByTitle['Main Catalog'];
}

module.exports = {
    googleAuth,
    getMcatalogSheet,
}