require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { updateColours } = require.main.require('./resources/modules/colour.js');

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

initSheet = async (client) => {
    getMcatalogSheet().then((sheet) => {
        this.sheet = sheet;
        refreshRows();
        updateColours(client, sheet);
    });

    setInterval(async () => {
        refreshRows();
    }, 10 * 60 * 1000); // 10 minutes - minutes * seconds * milliseconds
}

refreshRows = async () => {
    if (this.sheet) {
        this.rows = await this.sheet.getRows();
        this.rows.fetchedAt = new Date();
        console.log('Sheet data refreshed');
    }
}

getRows = () => {
    return this.rows;
}

module.exports = {
    initSheet,
    getRows
}