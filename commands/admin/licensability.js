const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRows, getMCatalogCellURL } = require.main.require('./resources/modules/sheet.js');
const { timeFormat } = require.main.require('./resources/modules/util.js');
const { genreColour } = require.main.require('./resources/modules/colour.js');
const { fetchJSON, getReleaseID, getPlayerURL, getAPIURL } = require.main.require('./resources/modules/monstercat.js');

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

        let tracks = [], jsonCache = [], percent = 0, lastPercent = 0, mismatches = 0;
        const messageChannel = await interaction.client.channels.fetch(interaction.channelId);
        const messageID = sentMessage.id;

        const thread = await messageChannel.threads.create({
            name: `CC Mismatches - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}UTC`,
            reason: 'Thread for licensability mismatches found by the licensability command.',
        });
        thread.members.add(interaction.user.id);
        thread.send(
            `**Excluded**:
- Rows with the label "EP", "Album", "Compilation", or "Double Single"
- Mirai Sekai tracks (known intentional formatting differences)
**Formatting tricks**:
- "VIP Mix" on API replaced with "VIP"
- "Muzzy" on API replaced with "MUZZ"
- "Original" removed from API Version
- "Cliché" on MCatalog replaced with "Cliche"
- \`’ ' . ? - ( )\` ignored
- " x " on API replaced with " & "
- Case ignored`);

        try {
            for (const [rowNum, row] of rows.entries()) {
                if (rowNum < 3) continue; // Skip header rows
                if (row.Track.includes("Mirai Sekai")) continue; // Skip Mirai Sekai tracks due to known intentional formatting differences
                if (["ep", "album", "compilation", "double single"].includes(row.Label.toLowerCase())) continue; // Skip album release rows as not applicable

                if ((percent = Math.round((rowNum / rows.length) * 100)) > lastPercent) { // Update progress message every 1% (or on the last row)
                    let funcTime = Date.now() - startTime;
                    let timeLeft = percent == 100 ? 0 : (funcTime / rowNum) * (rows.length - rowNum) / 1000;
                    // Edit the message manually instead of using interaction.editReply() to avoid 15 minute timeout
                    messageChannel.messages.edit(messageID, `Scanning for CC mismatches... ${percent}% done (${rowNum} / ${rows.length}), ${mismatches} detected so far. Est. time remaining: ${timeFormat(timeLeft)}`);
                    lastPercent = percent;
                }

                // Try to fetch from cache first, else fetch from API
                let json = jsonCache.find(j => j.Release.CatalogId == getReleaseID(row.ID)) ?? await fetchJSON(row.ID);

                // If we got a json with "Tracks" (i.e. a valid release), save the attributes we need. Else, report a mismatch and move on to the next row.
                if (json.Tracks) {
                    // Cache releases with multiple tracks to minimise API calls
                    if (json.Tracks.length > 1) {
                        jsonCache = [json].concat(jsonCache);
                        if (jsonCache.length > 50) jsonCache.pop();
                    }
                    tracks = json.Tracks.map(t => ({
                        title: t.Title,
                        version: t.Version,
                        creatorFriendly: t.CreatorFriendly
                    }));
                } else {
                    mismatches++;
                    const embed = new EmbedBuilder()
                        .setTitle(`[${row.ID}] ${row.Artists} - ${row.Track}`)
                        .setDescription(`Failed to fetch release data from [Monstercat API](${getAPIURL(row.ID)}). Either it's not on the API, or the ID is wrong on the API or MCatalog.`)
                        .setColor(genreColour(row.Label));
                    thread.send({ embeds: [embed] });
                    continue;
                }
                
                // Filter instead of find in case there are multiple tracks with the same title (e.g. a VIP and Original), then try to pick the correct one based on version name length (e.g. "X VIP" > "X")
                let matches = tracks.filter(t => {
                    const mcatalogTrack = row.Track.replace(/’|'|\.|\?|\- |\(|\)/g, '').replace("Cliché", "Cliche").toLowerCase();
                    const mcatTrack = t.title.replace(/’|'|\.|\?|\- |\(|\)/g, '').replace("Muzzy", "MUZZ").replace(" x ", " & ").toLowerCase();
                    const titleMatch = 
                        (row.Track.includes("VIP") || row.Track.includes("(") || t.title.includes("(") || t.version)
                            ? mcatalogTrack.includes(mcatTrack) || mcatTrack.includes(mcatalogTrack)
                            : mcatalogTrack.toLowerCase() == mcatTrack;
                    const versionMatch = t.version ? mcatalogTrack.includes(t.version.replace(/’|'|\.|\- |\(|\)/g, '').replace("Muzzy", "MUZZ").replace(" x ", " & ").replace("VIP Mix", "VIP").replace("Original", "").toLowerCase()) : true;
                    return titleMatch && versionMatch;
                });
                let track = matches.length == 1 ? matches[0] : (matches.sort((a, b) => (b.version?.length || 0) - (a.version?.length || 0))[0]);
                
                if (track) {
                    // If the track is found, compare the creator-friendly-ness and report if there's a mismatch    
                    let catalogCC = row.CC == 'Y';
                    if (track.creatorFriendly != catalogCC) {
                        mismatches++;
                        const embed = new EmbedBuilder()
                            .setTitle(`[${row.ID}] ${row.Artists} - ${row.Track}`)
                            .setDescription(`[MCatalog CC](${getMCatalogCellURL(row.ID, row.Track)}): ${catalogCC}, [MCat CC](${getPlayerURL(row.ID)}): ${track.creatorFriendly}`)
                            .setColor(genreColour(row.Label));
                        thread.send({ embeds: [embed] });
                    }
                } else {
                    // If the track isn't found, report a mismatch and provide URLs for investigation
                    mismatches++;
                    const embed = new EmbedBuilder()
                        .setTitle(`[${row.ID}] ${row.Artists} - ${row.Track}`)
                        .setDescription(`Couldn't find this track in [the release returned from the API](${getAPIURL(row.ID)}). Tracks for this release:\n\n${tracks.map(t => `${t.title} ${t.version ? t.version : ''}`).join('\n')}`)
                        .setColor(genreColour(row.Label));
                    thread.send({ embeds: [embed] });
                }
            }
        }
        catch (err) {
            console.error(err);
        }

        funcTime = Date.now() - startTime;
        // Edit the message manually instead of using interaction.editReply() to avoid 15 minute timeout
        (await messageChannel.messages.fetch(messageID)).reply(`Scan complete! Found ${mismatches} mismatches in ${timeFormat(funcTime / 1000)}. Check ${thread} for details.`);
    },
};