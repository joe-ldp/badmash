require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = {
    googleAuth: (client) => {
        const google = require.main.require('./resources/keys/google.json');
    
        // Set credentials
        google.private_key_id = process.env.GOOGLE_PRIVATE_KEY_ID;
        google.private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        client.google = google;
    },

    getMcatalogSheet: async (google) => {
        const doc = new GoogleSpreadsheet(process.env.SHEET_KEY);
        await doc.useServiceAccountAuth(google);
        await doc.loadInfo();
        
        return doc.sheetsByTitle['Main Catalog'];
    },

    getGenreColours: async (google) => {
        const colorSheetKey = '1Jlk6YdhYkRayveVV-LlGhtPEhHLptbtkbAu-n6JfxSw';
        const colorSheet = new GoogleSpreadsheet(colorSheetKey);

        await colorSheet.useServiceAccountAuth(google);
        await colorSheet.loadInfo();

        const colSheet = colorSheet.sheetsByTitle['Genres'];
        const colRows = await colSheet.getRows();

        let colours = {};
        colRows.forEach(row => {
            if(row.Genre != undefined && row.Colour != undefined)
                colours[row.Genre.toLowerCase()] = row.Colour.substring(1);
        });

        return colours;
    }
}