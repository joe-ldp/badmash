const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRows } = require.main.require('./resources/modules/sheet.js');
const { timeFormat } = require.main.require('./resources/modules/util.js');
const { genreColour } = require.main.require('./resources/modules/colour.js');
const { fetchJSON, getCoverURL } = require.main.require('./resources/modules/monstercat.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('post')
        .setDescription('Posts release info.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the release to post.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('The channel to post in (mention or name). If not specified, posts in the current channel.')
                .setRequired(false)),
    async execute(interaction) {
        const postChannel = interaction.options.getString('channel') ?? interaction.channel.id;
        const ID = interaction.options.getString('id');
        
        let channel;
        const postChannelTrimmed = postChannel.replace(/<|>|#/g, '');
        if (isNaN(postChannelTrimmed)) {
            channel = interaction.guild.channels.cache.find(c => c.name === postChannelTrimmed);
        } else {
            channel = interaction.guild.channels.cache.get(postChannelTrimmed);
        }

        if (!channel) {
            return interaction.editReply("Couldn't find the specified channel! Please tag it or paste its ID. Must be in this server.");
        }

        if (!channel.permissionsFor(interaction.user).has('SendMessages', false)) {
            return interaction.reply("You don't have permission to send messages in that channel!");
        }
        
        const rows = getRows();

        if (!rows)
            return interaction.reply('The catalog is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
        else
            await interaction.deferReply();

        const embed = new EmbedBuilder();

        const json = await fetchJSON(ID);
        const release = json.Release;
        const releaseType = release.Type == "EP" ? "EP" : release.Type == "Album" ? "LP" : "";

        const releaseDate = new Date(Date.parse(release.ReleaseDate));
        const releaseDateString = releaseDate.toISOString().split('T')[0];

        let tracklist = [];
        let totalDuration = 0;
        json.Tracks.sort((a, b) => a.TrackNumber - b.TrackNumber).forEach(track => {
            const version = track.Version == '' ? '' : `(${track.Version})`;
            tracklist.push([`${track.TrackNumber}. ${track.ArtistsTitle} - ${track.Title} ${version}`, `Genre: **${track.GenreSecondary}**, Duration: **${timeFormat(track.Duration)}**`]);
            totalDuration += track.Duration;
        });

        embed.setFooter({ text: `Posted by ${interaction.user.username}. All data fetched from Monstercat API.` });
        embed.setColor(genreColour(release.GenreSecondary.toLowerCase()));
        embed.setTitle(`${release.ArtistsTitle} - ${release.Title} ${releaseType}`);
        embed.setURL(`https://monstercat.com/release/${ID}`);

        embed.addFields({
            name: '**Primary Genre:**',
            value: `${release.GenreSecondary}`,
            inline: true
        }, {
            name: '**Runtime:**',
            value: `${timeFormat(totalDuration)}`,
            inline: true
        }, {
            name: '**Catalog ID:**',
            value: `${ID}`,
            inline: true
        }, {
            name: '**Release Type:**',
            value: `${release.Type}`,
            inline: true
        }, {
            name: '**Release Date:**',
            value: `${releaseDateString}`,
            inline: true
        });

        embed.setThumbnail(await getCoverURL(release.CatalogId));

        if (release.Links && release.Links.length > 0) {
            let links = release.Links.sort((a, b) => a.Platform.localeCompare(b.Platform));
            let linksText = links.map(l => `[${l.Platform}](${l.Url})`).join('\n');
            embed.addFields({name: `**Listen on:**`, value: `${linksText}`});
        }
        else {
            embed.addFields({name: `**Listen on:**`, value: `No links available through Monstercat API! Sorry :(`});
        }

        tracklist.forEach(track => {
            embed.addFields({ name: track[0], value: track[1] });
        });

        if (channel == interaction.channel) {
            return interaction.editReply({ embeds: [embed] });
        } else {
            let msg = await channel.send({ embeds: [embed] });
            return interaction.editReply(`Posted release info: ${msg.url}!`);
        }
    },
};