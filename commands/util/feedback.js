const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('feedback')
		.setDescription('Submit feedback, issues, ideas, or anything else you want to share. Your username will be recorded.')
        .addStringOption(option =>
            option.setName('feedback')
            .setDescription('Your feedback, issue, idea, or anything else you want to share with the bot owner(s).')
            .setRequired(true)
            .setMaxLength(4000)),
	async execute(interaction) {
		let embed;

		try {
            embed = new EmbedBuilder()
                .setTitle('New Feedback Submission')
                .setDescription(interaction.options.getString('feedback'))
                .addFields(
                    { name: 'User', value: `${interaction.user.username} (${interaction.user.id})` },
                    { name: 'Date', value: new Date().toISOString() }
                )
                .setColor(0x00AE86);
        } catch (err) {
            interaction.reply('An unexpected error occurred.');
            throw(err);
        }

        const feedbackChannel = await interaction.client.channels.fetch(process.env.FEEDBACK_CHANNEL_ID);
        feedbackChannel.send({ embeds: [embed] });

		return interaction.reply('Thank you for your feedback! It has been submitted to the bot owner(s).');
	},
};