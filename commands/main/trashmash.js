const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateMashupTitle, generateGenreName } = require.main.require('./resources/modules/llm.js');
const { pickTrack } = require.main.require('./resources/modules/pickTrack.js');
const { genreColour, blendColors } = require.main.require('./resources/modules/colour.js');
const { getKeyID, getMinKey, getMajKey } = require.main.require('./resources/modules/key.js');
const { getRows } = require.main.require('./resources/modules/sheet.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('trashmash')
        .setDescription('Generates tracklist for a trashmash (random tracks).')
        .addNumberOption(option =>
            option.setName('tracks')
            .setDescription('The number of tracks.')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(20)),
    async execute(interaction) {
        await interaction.deferReply();
        const startTime = interaction.createdAt;
        const embed = new EmbedBuilder();

        const numTracks = interaction.options.getNumber('tracks') ?? 2;
        const rows = await getRows();

        try {
            // Pick n random releases
            let tracks = [];
            for (let i = 0; i < numTracks; i++) {
                tracks.push(pickTrack(tracks, rows, '*', '*', '*'));
            }

            // Sort tracks alphabetically
            tracks.sort((a, b) => (a.Artists + ' ' + a.Track).localeCompare((b.Artists + ' ' + b.Track)));

            let totBPM = tracks.reduce((tot, track) => tot + parseInt(track.BPM), 0),
                totKey = tracks.reduce((tot, track) => tot + getKeyID(track.Key), 0),
                
                avgBPM = Math.round(totBPM / numTracks),
                avgKeyID = Math.floor(totKey / numTracks),
                avgKey = getMinKey(avgKeyID);

            // Add tracks to embed message
            tracks.forEach(track => {
                let keyDiff = avgKeyID - getKeyID(track.Key);
                if (keyDiff >= 0)
                    keyDiff = '+' + keyDiff;
                
                embed.addFields({ name: `${track.Artists} - ${track.Track}`, value: `Key: ${track.Key} (pitch ${keyDiff}), BPM: ${track.BPM}` });
            });
            
            const genres = tracks.map(t => t.Label);
            const mashupGenre = await generateGenreName(genres);
            const colour = blendColors(genres.map(g => genreColour(g)));

            embed
                .setTitle(await generateMashupTitleManual(mashupGenre, interaction.user.username, avgKey))
                .setDescription(`Suggested key: ${avgKey} (${getMajKey(avgKeyID)})\nSuggested BPM: ${avgBPM}\nGenre: ${mashupGenre}`)
                .setColor(colour);
        } catch (err) {
            throw(err);
        }

        // Calculate and report the total run time of the function
        const funcTime = Date.now() - startTime;
        embed.setFooter({ text: `Retrieved in ${funcTime}ms.` });

        // Finally send the message
        return interaction.editReply({ embeds: [embed] });
    },
};

