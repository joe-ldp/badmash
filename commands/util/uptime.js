const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { genreColour } = require.main.require('./resources/modules/colour.js');
const prettyMilliseconds = require('@postman/pretty-ms');

module.exports = {
    cooldown: 5,
	data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Shows how long the bot has been online.'),
	async execute(interaction) {
		const colour = genreColour();
		const embed = new EmbedBuilder()
			.setColor(colour)
			.setTitle(`🕒 Hi! The bot has been up for ${prettyMilliseconds(interaction.client.uptime, { verbose: true })}.`);
		await interaction.reply({ embeds: [embed] });
	},
};