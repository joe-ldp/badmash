const { SlashCommandBuilder } = require('discord.js');
const { buildEmbed } = require.main.require('./resources/modules/embed.js');
require.main.require('./resources/modules/monstercat.js');

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Shows information about a random Monstercat track.'),
	async execute(interaction) {
		const startTime = Date.now();
		
		if (!interaction.client.sheet)
			return interaction.reply('The Google sheets connection is not yet loaded. Please try again in a moment. If this message persists, contact the bot owner(s).');
		else
			interaction.deferReply();
		
		const rows = await interaction.client.sheet.getRows();
		let embed;

		try {
            let track;
            do {
                track = rows[Math.floor(Math.random() * rows.length)];
            }
            while (
                track.Label.toLowerCase() == 'album' ||
                track.Label.toLowerCase() == 'ep' ||
                track.Label.toLowerCase() == 'compilation'
            );
    
            // embed.addField(`**Wait!** Were you choosing songs for a **mashup**?`, `Try using the \`${this.client.commandPrefix}generate\` command!`);
			embed = await buildEmbed(track, startTime);
		} catch (err) {
            interaction.editReply('An unexpected error occurred.');
            throw(err);
		}

		return interaction.editReply({ embeds: [embed] });
	},
};