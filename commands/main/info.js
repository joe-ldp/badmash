const { SlashCommandBuilder } = require('discord.js');
const { buildEmbed } = require.main.require('./resources/modules/embed.js');
const { searchTrack } = require.main.require('./resources/modules/pickTrack.js');

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
		const searchArg = interaction.options.getString('track');
		const verbose = interaction.options.getBoolean('verbose') ?? false;
		const startTime = interaction.createdAt;
		
		const rows = getRows();
		
		if (!rows)
			return interaction.reply('The catalog is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
		
		let embed;

		try {
			const row = searchTrack(rows, searchArg);
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