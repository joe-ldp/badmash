const { SlashCommandBuilder } = require('discord.js');
const { buildEmbed } = require.main.require('./resources/modules/embed.js');

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Shows information about a Monstercat track.')
		.addStringOption(option =>
			option.setName('track')
			.setDescription('The track to get information about.')
			.setRequired(true))
		.addBooleanOption(option =>
			option.setName('verbose')
			.setDescription('Show extra information (including ISRC, etc.) about the track.')
			.setRequired(false)),
	async execute(interaction) {
		const searchArgs = interaction.options.getString('track').toLowerCase().trim().split(/ +/g);
		const verbose = interaction.options.getBoolean('verbose') ?? false;
		const startTime = interaction.createdAt;
		
		const rows = getRows();
		
		if (!rows)
			return interaction.reply('The catalog is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
		
		let embed;

		try {
			const row = search(rows, searchArgs);
			embed = await buildEmbed(row, startTime, interaction.client.colours, verbose);
		} catch (err) {
			if (err === 'no_match')
				return interaction.reply('I cannot find a match for that search entry.');
			else {
				interaction.reply('An unexpected error occurred.');
				throw(err);
			}
		}

		return interaction.reply({ embeds: [embed] });
	},
};

search = (rows, args) => {
	let matchCounter = [];
	const mergedArgs = args.join(' '),
		dupes = ['remix', 'remixes', 'remake', 'vip', 'classical', 'mix', 'acoustic', '+'],
		reduceWeight = ['ep', 'album', 'compilation'];

	for (const [rowNum, row] of rows.entries()) {
		let weight = 1,
			rowMatches = 0;

		const searchFields = [
				row.ID, row.Date, row.Label, row.Artists, row.Track, row.Comp, row.Length, row.BPM, row.Key
			].filter(v => v !== undefined).map(v => v.toLowerCase()),
			searchFieldsJoined = searchFields.join(' ');

		if (dupes.some((dupe) => row.Track.includes(dupe) && !mergedArgs.includes(dupe))) continue;

		// EPs, albums, and compilations have a lower weight
		if (reduceWeight.includes(row.Label.toLowerCase())) weight = 0.5;

		args.forEach(arg => {
			if (searchFieldsJoined.includes(arg)) {
				dupes.forEach(dupe => {
					if (searchFields.includes(dupe) && !mergedArgs.includes(dupe)) return;
					rowMatches += weight;
				});
			}
		});

		if (rowMatches) {
			matchCounter.push({
				row: rowNum,
				matches: rowMatches
			});
		}
	}

	if (matchCounter.length) {
		let index = 0;
		for (let i = 0; i < matchCounter.length; i++) {
			if (matchCounter[i].matches > matchCounter[index].matches) index = i;
		}

		return rows[matchCounter[index].row];
	}
	// Sad violin music
	else throw 'no_match';
}