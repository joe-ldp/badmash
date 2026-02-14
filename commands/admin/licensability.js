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

        if (!rows)
            return interaction.reply('The catalog is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
        
        let sentMessage = await interaction.reply({ content: `Scanning for CC mismatches... 0% done (0 / ${rows.length}), 0 detected so far. Est. time remaining: bruh idfk yet chill`, fetchReply: true });

        let tracks, percent = 0, lastPercent = 0, mismatches = 0;
        const messageChannel = await interaction.client.channels.fetch(interaction.channelId);
        const messageID = sentMessage.id;

        const thread = await messageChannel.threads.create({
            name: `CC Mismatches - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}UTC`,
            reason: 'Thread for licensability mismatches found by the licensability command.',
        });
        thread.members.add(interaction.user.id);

        try {
            for (const [rowNum, row] of rows.entries()) {
                if (rowNum == 0) continue;
                if ((percent = Math.round((rowNum / rows.length) * 100)) > lastPercent) {
                    let funcTime = Date.now() - startTime;
                    let timeLeft = (funcTime / rowNum) * (rows.length - rowNum) / 1000;
                    if (percent == 100) timeLeft = 0;
                    messageChannel.messages.edit(messageID, `Scanning for CC mismatches... ${percent}% done (${rowNum} / ${rows.length}), ${mismatches} detected so far. Est. time remaining: ${timeFormat(timeLeft)}`);
                    lastPercent = percent;
                }

                if (["ep", "album", "compilation"].includes(row.Label.toLowerCase())) continue;
                
                try {
                    let res = await fetchJSON(row.ID);
                    if (!res.Tracks) throw "o no";
                    tracks = res.Tracks.map(t => ({
                        title: t.Title,
                        creatorFriendly: t.CreatorFriendly
                    }));
                } catch (err) {
                    mismatches++;
                    const embed = new EmbedBuilder()
                        .setTitle(`[${row.ID}] ${row.Artists} - ${row.Track}`)
                        .setDescription(`Failed to fetch release data from Monstercat API. Either it's not on the player or the ID is wrong on MCatalog.`)
                        .setColor(genreColour(row.Label));
                    thread.send({ embeds: [embed] });
                    continue;
                }
                
                let track = tracks.find(t => row.Track.includes(t.title));

                let catalogCC = row.CC == 'Y';
                if (track && (track.creatorFriendly != catalogCC)) {
                    mismatches++;
                    const embed = new EmbedBuilder()
                        .setTitle(`[${row.ID}] ${row.Artists} - ${row.Track}`)
                        .setDescription(`MCatalog CC: ${catalogCC}, MCat CC: ${track.creatorFriendly}`)
                        .setColor(genreColour(row.Label));
                    thread.send({ embeds: [embed] });
                }
            }
        }
        catch (err) {
            console.error(err);
        }

        funcTime = Date.now() - startTime;
        (await messageChannel.messages.fetch(messageID)).reply(`Scan complete! Found ${mismatches} mismatches in ${timeFormat(funcTime / 1000)}. Check ${thread} for details.`);
    },
};