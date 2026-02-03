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

blendColors = (colorA, colorB, amount = 0.5) => {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));

    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');

    return '#' + r + g + b;
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