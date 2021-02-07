// lookup.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command
{
  constructor (client) 
  {
    super(client, 
          {
            name: 'random',
            group: 'main',
            memberName: 'random',
            aliases: ['r'],
            description: 'Shows information regarding a random track.',
            throttling: 
            {
              usages: 1,
              duration: 10
            },
            examples: [`${client.commandPrefix}random`]
          });
  }
  
  async run (message)
  {
    // Initialize args
    const args = message.content.slice(this.client.commandPrefix.length).trim().split(/ +/g);
    args.shift();
    
    // Capture the time at the start of function execution
    var startTime = new Date().getTime();

    var embed;
    const rows = await this.client.handler.getRows(this.client);

    var track;
  
    // Big try/catch purely to spam ping Hanabi when you're debugging a crashing issue
    try
    {
        do
        {
            track = rows[Math.floor(Math.random() * rows.length)];
        } 
        while 
        (
            track.Label == "album" ||
            track.Label == "ep" ||
            track.Label == "compilation"
        );

        embed = await this.client.handler.formatInfo(this.client, track);
        embed.addField(`**Wait!** Were you choosing songs for a **mashup**?`, `Try using the \`${this.client.commandPrefix}generate\` command!`);
    }
    catch (err)
    {
      // Inform bot owner for error, send error log, and log it
      await this.client.handler.throw(this.client, message, err);
    }

    // Calculate and log the total run time of the function
    const funcTime = Date.now() - startTime;
    embed.setFooter(`Retrieved in ${funcTime}ms.`, `${this.client.botAvatar}`);

    // Finally send the message
    message.channel.send(embed).catch(console.error);
  }
}