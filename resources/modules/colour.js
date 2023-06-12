const colours = require.main.require('./resources/objects/colours.json');

module.exports = {
    genreColour: (genre = 'random') => {
        if (genre.toLowerCase() == 'random') {
            const vals = Object.keys(colours);
            return colours[vals[Math.floor(Math.random() * vals.length)]];
        } else {
            return colours[genre.toLowerCase()] ?? 'b9b9b9'; // or call module.exports.genreColour() for a random genre colour
        }
    },

    updateColours: async (client) => {
        console.log('Loading cells...');
		await client.sheet.loadCells();
		console.log('Loaded cells.');
		console.log(client.sheet.getCellByA1('F3'));
    }
}