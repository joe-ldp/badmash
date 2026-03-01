const fs = require('node:fs');
const coloursJson = './resources/objects/colours.json';
const genresJson = './resources/objects/genres.json';

genreColour = (genre = 'random') => {
    const colours = require.main.require(coloursJson);
    if (genre.toLowerCase() == 'random') {
        let colourVals = Object.keys(colours);
        return colours[colourVals[Math.floor(Math.random() * colourVals.length)]];
    } else {
        return colours[genre.toLowerCase()] ?? 'b9b9b9'; // or call module.exports.genreColour() for a random genre colour
    }
}

updateColours = async (client, sheet) => {
    let foundGenres = [],
        colours = {};

    await sheet.loadCells(`E:F`);

    for (let i = 3; i < sheet.rowCount; i++) {
        let cell = sheet.getCellByA1(`F${i}`);
        if (cell.value) {
            let genre = sheet.getCellByA1(`E${i}`).value.toLowerCase();
            if (!foundGenres.includes(genre)) {
                foundGenres.push(genre);
                // effectiveFormat is used because the MCatalog's colours are based on conditional formatting
                let colour = processColour(cell.effectiveFormat.backgroundColor);
                colours[genre] = colour;
            }
        }
    }

    // Update currently loaded genres and colours objects (without this, bot would need rebooting again)
    client.colours = colours;
    client.genres = foundGenres;

    // Save genres json
    fs.writeFile(genresJson, JSON.stringify(foundGenres), (err) => {
        if (err) throw err;
        console.log(`Genres updated and saved to ${genresJson}`);
    });

    // Save colours json
    fs.writeFile(coloursJson, JSON.stringify(colours), (err) => {
        if (err) throw err;
        console.log(`Colours updated and saved to ${coloursJson}`);
    });
}

blendColors = (colours) => {
    let rgbs = colours.map(hex => {
        const [rA, gA, bA] = hex.match(/\w\w/g).map((c) => parseInt(c, 16));
        return { r: rA, g: gA, b: bA };
    });

    let avgR = Math.round(rgbs.reduce((sum, c) => sum + c.r, 0) / rgbs.length),
        avgG = Math.round(rgbs.reduce((sum, c) => sum + c.g, 0) / rgbs.length),
        avgB = Math.round(rgbs.reduce((sum, c) => sum + c.b, 0) / rgbs.length);

    return processColour({ red: avgR / 255, green: avgG / 255, blue: avgB / 255 }); 
}

/*
* Processes a colour object with optional attributes {red, green, blue} 0-1
* @param {Object} colourObj
* @returns {String} Hex code for the colour (no prepended #)
*/
processColour = (colourObj) => {
    let r = Math.round(255 * (colourObj.red ?? 0)),
        g = Math.round(255 * (colourObj.green ?? 0)),
        b = Math.round(255 * (colourObj.blue ?? 0));
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

module.exports = {
    genreColour,
    updateColours,
    blendColors
}