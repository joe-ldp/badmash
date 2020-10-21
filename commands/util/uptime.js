// uptime.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command
{
    constructor (client) 
    {
        super(client, 
        {
            name: 'uptime',
            group: 'util',
            memberName: 'uptime',
            aliases: ['isbotdead', 'hello', 'hi'],
            description: "Shows how long the bot has been online.",
            examples: [`${client.commandPrefix}uptime`]
        });
    }
  
    run (message)
    {
      // Initialize Discord embed and basic variables
      const embed = new this.client.Discord.MessageEmbed();
      var x, send = [],
          color = this.client.handler.colorize(this.client);

      // Convert client uptime from ms to seconds
      let totalSeconds = (this.client.uptime / 1000);

      // Calculate days
      let days = Math.floor(totalSeconds / 86400);

      // Push to hours
      totalSeconds %= 86400;

      // Calculate hours
      let hours = Math.floor(totalSeconds / 3600);

      // Push to minutes
      totalSeconds %= 3600;

      // Calculate minutes and seconds
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = Math.floor(totalSeconds % 60);

      // Format and build acquired data for embed
      let uptime = `Hi! The bot has been up for `;
      let dsend = `${days} day`;
      let hrsend = `${hours} hour`;
      let minsend = `${minutes} minute`;
      let ssend = `${seconds} second`;

      if (days > 1) dsend += `s`;
      if (hours > 1) hrsend += `s`;
      if (minutes > 1) minsend += `s`;
      if (seconds > 1) ssend += `s`;

      if (days > 0) send.push(dsend);
      if (hours > 0) send.push(hrsend);
      if (minutes > 0) send.push(minsend);
      if (seconds > 0) send.push(ssend);

      if (send.length == 1) uptime += send + `.`;
      else
      {
        for (x = 0; x < send.length; x++)
        {
          if (x == send.length - 2)
          {
            if (send.length == 2) uptime += send[x] + ` and `;
            else uptime += send[x] + `, and `;
          }
          else if (x == send.length - 1) uptime += send[x] + `.`;
          else uptime += send[x] + `, `;
        }
      }

      embed
        .setColor(`${color}`)
        .setTitle(`:timer: ${uptime}`)

      // Send the embed
      message.channel.send(embed).catch(console.error);
    }
}