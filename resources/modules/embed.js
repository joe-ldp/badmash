const { EmbedBuilder } = require('discord.js');
const mcat = require.main.require('./resources/modules/monstercat.js');
const licensability = require.main.require('./resources/objects/licensability.json');

buildEmbed = async (row, startTime, colours, verbose = false) => {
    const releaseJSON = await mcat.fetchJSON(row.ID);
    const colour = colours[row.Label.toLowerCase()] ?? 'b9b9b9';
    const CC = await mcat.getCreatorFriendly(releaseJSON, row.Track);
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
        .setURL(mcat.getReleaseURL(row.ID))
        .setDescription(`${licensability[CC]}`)
        .setThumbnail(mcat.getCoverURL(row.ID))
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

    if (verbose) {
        embed.
            addFields(
                { name: 'Brand', value: mcat.getBrand(releaseJSON, row.Track), inline: true },
                { name: 'UPC', value: mcat.getReleaseID(row.ID), inline: true },
                { name: 'Track \#', value: mcat.getTrackNumber(releaseJSON, row.Track).toString(), inline: true},
                { name: 'ISRC', value: mcat.getISRC(releaseJSON, row.Track), inline: false },
                { name: 'GRid', value: mcat.getGRid(releaseJSON), inline: false },
            );
    }

    return embed;
}

module.exports = {
    buildEmbed,
};