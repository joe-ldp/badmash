const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pickTrack } = require.main.require('./resources/modules/pickTrack.js');
const { genreColour, blendColors } = require.main.require('./resources/modules/colour.js');
const { getKeyID, getMinKey, getMajKey } = require.main.require('./resources/modules/key.js');
const { getRows } = require.main.require('./resources/modules/sheet.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('generate')
        .setDescription('Chooses tracks for a mashup based on given criteria.')
        .addNumberOption(option =>
            option.setName('tracks')
            .setDescription('The number of tracks.')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(20))
        .addStringOption(option =>
            option.setName('genre')
            .setDescription('The genre of the tracks.')
            .setRequired(false))
        .addNumberOption(option =>
            option.setName('bpm')
            .setDescription('The BPM of the mashup.')
            .setRequired(false)
            .setMinValue(90)
            .setMaxValue(200))
        .addStringOption(option =>
            option.setName('key')
            .setDescription('The key of the mashup.')
            .setRequired(false)
            .addChoices(
            { name: 'A min (C maj)',   value: '1' },
            { name: 'A# min (C# maj)', value: '2' },
            { name: 'B min (D maj)',   value: '3' },
            { name: 'C min (D# maj)',  value: '4' },
            { name: 'C# min (E maj)',  value: '5' },
            { name: 'D min (F maj)',   value: '6' },
            { name: 'D# min (F# maj)', value: '7' },
            { name: 'E min (G maj)',   value: '8' },
            { name: 'F min (G# maj)',  value: '9' },
            { name: 'F# min (A maj)',  value: '10' },
            { name: 'G min (Bb maj)',  value: '11' },
            { name: 'G# min (B maj)',  value: '12' }, )),
    async execute(interaction) {
        await interaction.deferReply();
        const startTime = new Date().getTime();

        const embed = new EmbedBuilder();

        const numTracks = interaction.options.getNumber('tracks') ?? 2;
        let desiredGenre = (interaction.options.getString('genre') ?? '*').toLowerCase(),
            desiredBPM = interaction.options.getNumber('bpm') ?? '*',
            desiredKey = interaction.options.getString('key') ?? '*';

        if (!interaction.client.genres.includes(desiredGenre) && desiredGenre != "*")
            return interaction.editReply(`\`${desiredGenre}\` is not a valid genre. Please specify a genre listed on the [MCatalog sheet](<https://docs.google.com/spreadsheets/d/116LycNEkWChmHmDK2HM2WV85fO3p3YTYDATpAthL8_g/edit#gid=21513865>).`);

        const rows = await getRows();

        try {
            // Pick n random releases
            let tracks = [];
            for (let i = 0; i < numTracks; i++) {
                let first = tracks[0] ?? { 'BPM': '*', 'Key': '*' };
                desiredKey = first.Key ?? desiredKey;
                desiredBPM = desiredBPM ?? first.BPM;
                tracks.push(pickTrack(tracks, rows, desiredGenre, desiredBPM, desiredKey));
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

            // Initialize variables
            let colour = genreColour(desiredGenre);

            if (desiredGenre == '*') {
                colour = genreColour(tracks[0].Label);
                tracks.forEach(track => {
                    colour = blendColors(colour, genreColour(track.Label));
                });

                // Randomly sort the array so we can get 2 random, but unique, genres
                tracks.sort(function () { return Math.random - 0.5 });
                const first = tracks[0].Label;
                const second = tracks[1].Label;

                // Pick a random prefix then add halves of the random genres
                const prefixes = require.main.require('./resources/objects/genrePrefixes.json');
                desiredGenre = prefixes[Math.floor(Math.random() * prefixes.length)] + first.slice(0, first.length / 2) + second.slice(second.length / 2);
            }

            // Capitalise first letter of each word in desiredGenre
            desiredGenre = desiredGenre.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            const user = interaction.user.username.charAt(0).toUpperCase() + interaction.user.username.slice(1);

            embed
                .setTitle(`${user}'s ${desiredGenre} mashup in ${avgKey}`)
                .setDescription(`Suggested key: ${avgKey} (${getMajKey(avgKeyID)})\nSuggested BPM: ${avgBPM}\nGenre: ${desiredGenre}`)
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

