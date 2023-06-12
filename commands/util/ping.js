const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { genreColour } = require.main.require('./resources/modules/colour.js');

module.exports = {
	cooldown: 1,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),
	async execute(interaction) {
		const ping = Date.now() - interaction.createdTimestamp;
		const colour = genreColour();

		const embed = new EmbedBuilder()
			.setColor(colour)
			.setTitle(`🏓 **Pong!** Ping is __${ping}__ ms.`);

		return interaction.reply({ embeds: [embed] });
	},
};