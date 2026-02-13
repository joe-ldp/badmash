const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');
const { getRows } = require.main.require('./resources/modules/sheet.js');
const { timeFormat } = require.main.require('./resources/modules/util.js');
const { fetchJSON } = require.main.require('./resources/modules/monstercat.js');
const { genreColour } = require.main.require('./resources/modules/colour.js');

module.exports = {
    ownerOnly: true,
    cooldown: 100,
    data: new SlashCommandBuilder()
        .setName('licensability')
        .setDescription('Checks the licensability of all tracks on MCatalog against the Monstercat API.'),
    async execute(interaction) {
        const startTime = interaction.createdAt;
        const rows = getRows();
        let sentMessage;

        if (!rows)
            return interaction.reply('The catalog is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
        else
            sentMessage = await interaction.reply({ content: `Scanning for CC mismatches... 0% done (0 / ${rows.length}), 0 detected so far. Est. time remaining: bruh idfk yet chill`, fetchReply: true });

        let mcatCC, catalogCC;
        let res, tracks, track, percent = 0, lastPercent = 0;
        let mismatches = [];
        let funcTime;
        let messageChannel = await interaction.client.channels.fetch(interaction.channelId);
        let messageID = sentMessage.id;

        try {
            for (const [rowNum, row] of rows.entries()) {
                if ((percent = Math.round((rowNum / rows.length) * 100)) > lastPercent) {
                    funcTime = Date.now() - startTime;
                    let timeLeft = (funcTime / rowNum) * (rows.length - rowNum) / 1000;
                    if (percent == 100) timeLeft = 0;
                    messageChannel.messages.edit(messageID, `Scanning for CC mismatches... ${percent}% done (${rowNum} / ${rows.length}), ${mismatches.length} detected so far. Est. time remaining: ${timeFormat(timeLeft)}`);
                    lastPercent = percent;
                }

                if (["ep", "album", "compilation"].includes(row.Label.toLowerCase())) continue;

                catalogCC = row.CC == 'Y';

                try {
                    res = await fetchJSON(row.ID);
                    if (!res.Tracks) throw "o no";
                    tracks = res.Tracks.map(t => ({
                        title: t.Title,
                        creatorFriendly: t.CreatorFriendly
                    }));
                } catch (err) {
                    console.error(`Failed to fetch MCat data for ${row.ID} (${row.Track}): ${err}`);
                    continue;
                }

                let found = false;
                tracks.forEach(thisTrack => {
                    if (row.Track.includes(thisTrack.title)) {
                        found = true;
                        track = thisTrack;
                    }
                });
                if (!found) continue;

                mcatCC = track.creatorFriendly;

                if (mcatCC != catalogCC) {
                    mismatches.push({ row, catalogCC, mcatCC });
                    //console.error(`MISMATCH: ${row.Track}: Catalog CC: ${catalogCC}, MCat CC: ${mcatCC}`);
                }
                else {
                    // console.log(`MATCH: ${row.Track}: Catalog CC: ${catalogCC}, MCat CC: ${mcatCC}`);
                }
            }
        }
        catch (err) {
            console.error(err);
        }

        funcTime = Date.now() - startTime;

        mismatches.forEach(async (mm) => {
            const embed = new EmbedBuilder()
                .setTitle(`${row.Artists} - ${row.Track}`)
                .setDescription(`MCatalog CC: ${catalogCC}, MCat CC: ${mcatCC}`)
                .setColor(genreColour(mm.row.Genre));
            await interaction.channel.send({ embeds: [embed] });
            console.log(`${mm.row.Artists} - ${mm.row.Track}`) | (`MCatalog CC: ${mm.catalogCC}, MCat CC: ${mm.mcatCC}`);
        });
    },
};