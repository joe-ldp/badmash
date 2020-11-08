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
        // Easy access for the bot avatar
        const botAvatar = this.client.users.cache.get(process.env.BOT_ID).avatarURL();
        const args = message.content.slice(this.client.commandPrefix).trim().split(/ +/g)[1];

        // --DEBUG-- Induce a fake error
        //if (args == "h") return this.client.handler.throw(this.client, message, args);
        
        // Initialize args and variables
        const
            hanabi = this.client.users.cache.get(process.env.OWNER_ID).tag,
            ravalle = this.client.users.cache.get(process.env.CO_ID).tag,

            prefix = this.process.env.prefix,
            embed = new MessageEmbed(),
            
            { commands } = this.client.registry;

        var color = this.client.handler.colorize(this.client);
        //var data;

        //return console.log(`${JSON.stringify(commands)}`);

        try
        {
            //data.push(commands.map(cmd => cmd.name).join(', '));

            // Master embed content
            embed
                .setColor(`${color}`)
                .setTitle(`MCatalog Bot v${process.env.VERSION}`)
                .setThumbnail(`${botAvatar}`)
                .setFooter(`Brought to you by ${hanabi} and ${ravalle}.`)
                .setDescription(`Badmash: A Discord bot that fetches data from\nhttps://rebrand.ly/mcatalog\n\n**Prefix: ${prefix}**`)
                //.addField(`${data}`);
                ;
            
            var cmdHelp = false;
            commands.forEach(cmd => 
            {
                // Detect any commands specified
                if ((args == cmd.name || cmd.aliases.indexOf(args) != -1))
                {
                  // Flag cmdHelp to indicate we want to display specific cmd info
                  cmdHelp = true;

                  // Add info to the embed
                  embed.addField(`Command: \`${prefix}${cmd.name}\``, `${cmd.description}`);
                  
                  var aliases = cmd.aliases.join(', '),
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
            message.channel.send(embed).catch(console.error);
        }
        catch (err)
        {
            // Inform bot owner for error, send error log, and log it
            this.client.handler.throw(this.client, message, err);
        }
    }
}