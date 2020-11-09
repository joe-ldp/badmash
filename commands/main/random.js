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
    
    // Easy access for the bot avatar
    const botAvatar = this.client.users.cache.get(process.env.BOT_ID).avatarURL();
    
    // Capture the time at the start of function execution
    var startTime = new Date().getTime();

    // Create a connection between the bot and the Google sheet
    const doc = this.client.doc;
    await doc.useServiceAccountAuth(client.google);
    await doc.loadInfo();

    var track, embed;
  
    // Big try/catch purely to spam ping Hanabi when you're debugging a crashing issue
    try
    {
        // Automatically find the Catalog sheet. Yay!
        var sheetId = 0;
        doc.sheetsByIndex.forEach(x => {
            if (x.title == "Catalog") sheetId = x.sheetId;
        });

        // Get the sheet and an obj array containing its rows
        const sheet = doc.sheetsById[sheetId];
        const rows = await sheet.getRows();

        do
        {
            track = rows[Math.floor(Math.random() * rows.length)];
        } 
        while 
        (
            track.Genre == "album" ||
            track.Genre == "ep" ||
            track.Genre == "compilation"
        );

        embed = await this.client.handler.format(this.client, track);
        embed.addField(`**Wait!** Were you choosing songs for a **mashup**?`, `Try using the \`${this.client.commandPrefix}generate\` command!`);
    }
    catch (err)
    {
      // Inform bot owner for error, send error log, and log it
      this.client.handler.throw(this.client, message, err);
    }

    // Calculate and log the total run time of the function
    var funcTime = Date.now() - startTime;
    embed.setFooter(`Retrieved in ${funcTime}ms.`, `${botAvatar}`);

    // Finally send the message
    message.channel.send(embed).catch(console.error);
  }
}