require('dotenv').config();
const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setActivity('rebrand.ly/mcatalog', { type:ActivityType.Watching });
		console.log(`Badmash v${process.env.VERSION} ready! Logged in as ${client.user.tag}`);
		console.log(`Currently serving ${client.guilds.cache.size} guilds and ${client.users.cache.size} users.`);
	},
};