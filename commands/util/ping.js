// ping.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command
{
    constructor (client) 
    {
        super(client, 
        {
            name: 'ping',
            group: 'util',
            memberName: 'ping',
            description: "Shows the bot's response time",
            examples: [`${client.commandPrefix}ping`]
        });
    }
  
    run (message)
    {
        try
        {
			// Initalize Discord embed and required variables
			const embed = new MessageEmbed();
			const ping = Date.now() - message.createdTimestamp;
			const color = this.client.handler.colorize(this.client);

			// Build the embed
			embed
				.setColor(`${color}`)
				.setTitle(`:ping_pong: **Pong!** Ping is __${Math.round(ping)}__ ms.`);
			
			return message.channel.send(embed).catch(console.error);
        }
        catch (err)
        {
            // Inform bot owner for error, send error log, and log it
            this.client.handler.throw(this.client, message, err);
        }
    }
}