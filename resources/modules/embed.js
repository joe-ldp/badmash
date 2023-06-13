const { EmbedBuilder } = require('discord.js');
const { releaseURL, coverURL, fetchJSON, creatorFriendly } = require.main.require('./resources/modules/monstercat.js');
const licensability = require.main.require('./resources/objects/licensability.json');

module.exports = {
    buildEmbed: async (row, startTime, colours) => {
        const releaseJSON = await fetchJSON(row.ID);
        const colour = colours[row.Label.toLowerCase()] ?? 'b9b9b9';
        const CC = await creatorFriendly(releaseJSON, row.Track);
        const funcTime = Date.now() - startTime;
        let primaryArtist, artistURL = undefined;
        try {
            primaryArtist = releaseJSON.Release.Artists.find(a => a.ArtistNumber == 1);
            artistURL = `https://monstercat.com/artist/${primaryArtist.URI}`;
        } catch (e) {
            // maybe log this?
        }
    
        const embed = new EmbedBuilder()
            .setColor(colour)
            .setTitle(`${row.Track}`)
            .setURL(releaseURL(row.ID))
            .setDescription(`${licensability[CC]}`)
            .setThumbnail(coverURL(row.ID))
            .addFields({
                name: '**Genre:**',
                value: `${row.Label}`,
                inline: false
            }, {
                name: '**Catalog:**',
                value: `${row.ID}`,
                inline: true
            }, {
                name: '**Date:**',
                value: `${row.Date}`,
                inline: true
            }, {
                name: '**Compilation:**',
                value: `${row.Comp}`,
                inline: true
            }, {
                name: '**BPM:**',
                value:`${row.BPM}`,
                inline: true
            }, {
                name: '**Key:**',
                value: `${row.Key}`,
                inline: true
            }, {
                name: '**Length:**',
                value: `${row.Length}`,
                inline: true
            })
            .setFooter({text: `Retrieved in ${funcTime}ms.`});

        if (artistURL) {
            embed.setAuthor({ name: `${row.Artists}`, url: `${artistURL}`})
        } else {
            embed.setAuthor({ name: `${row.Artists}`});
        }
    
        return embed;
    }
}