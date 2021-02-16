// help.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command
{
  constructor (client) 
  {
    super(client, 
    {
      name: 'help',
      group: 'util',
      memberName: 'help',
      aliases: ['h', 'wtf'],
      description: 'Lists and gives information about available commands.',
      examples: [`${client.commandPrefix}help`, `${client.commandPrefix}help info`],
    });
}

run (message)
{
  try
  {
      const args = message.content.slice(this.client.commandPrefix).trim().split(/ +/g)[1];
      const prefix = process.env.PREFIX;
      const embed = new MessageEmbed();

      const { commands } = this.client.registry;
      
      const color = this.client.handler.colorize(this.client);
      
      const hanabi = this.client.users.cache.get(process.env.OWNER_ID).tag;
      const ravalle = this.client.users.cache.get(process.env.CO_ID).tag;

      // Master embed content
      embed
        .setColor(`${color}`)
        .setTitle(`MCatalog Bot v${process.env.VERSION}`)
        .setThumbnail(`${this.client.botAvatar}`)
        .setFooter(`Brought to you by ${hanabi} and ${ravalle}.`)
        .setDescription(`Badmash: A Discord bot that fetches data from\nhttps://rebrand.ly/mcatalog\n\n**Prefix: ${prefix}**`)
        ;
      
      let cmdHelp = false;
      commands.forEach(cmd => 
      {
        // Detect any commands specified
        if ((args == cmd.name || cmd.aliases.indexOf(args) != -1))
        {
          // Flag cmdHelp to indicate we want to display specific cmd info
          cmdHelp = true;

          // Add info to the embed
          embed.addField(`Command: \`${prefix}${cmd.name}\``, `${cmd.description}`);
          
          let aliases = cmd.aliases.join(', '),
            examples = cmd.examples.join('\n');

          embed
            .addField(`Aliases:`, `${aliases}`)
            .addField(`Examples:`, `${examples}`);
        }
      });
      
      // No command was detected in the user input, display default help message
      if (!cmdHelp)
      {
        embed
          .addField(`**Command List**`, `Below is a list of commands provided by this bot.`);
        
        commands.forEach(cmd =>
        {
          if(cmd.groupID != "admin" && cmd.groupID != "commands" && cmd.name != "eval")
            embed.addField(`${cmd.name}`, `${cmd.description}`);
        });
      }

      // Send the embed
      message.channel.send(embed);
    }
    catch (err)
    {
      // Inform bot owner for error, send error log, and log it
      this.client.handler.throw(this.client, err, message);
    }
  }
}