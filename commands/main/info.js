// lookup.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
module.exports = class extends Command
{
  constructor (client) 
  {
    super(client, 
          {
            name: 'info',
            group: 'main',
            memberName: 'info',
            aliases: ['i', 'lookup'],
            description: 'Shows information regarding a Monstercat track.',
            throttling: 
            {
              usages: 1,
              duration: 5
            },
            examples: [
              `${client.commandPrefix}info badmash`,
              `${client.commandPrefix}info slander potions au5 remix`,
              `${client.commandPrefix}info uncaged vol 9`
            ]
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

    const embed = new this.client.Discord.MessageEmbed();

    const rows = this.client.getRows.getRows(this.client);
  
    // Big try/catch purely to spam ping Hanabi when you're debugging a crashing issue
    try
    {
      // Prevent crash from entering empty args
      if (!args[0])
        return message.reply("You entered nothing.");

      // --DEBUG-- Log user input
      console.log("Lookup initiated: ", args);

      // Reinitialize inputs as lowercase
      for (var i = 0; i < args.length; i++) args[i] = args[i].toLowerCase();

      // Initialize required variables for sheet lookup
      var rowStr, theRow,
          rowMatches = 0,
          anyMatch = false,
          matchCounter = [],
          mergedArgs = args.join(" "), 
          dupes = [ "remix", "remake", "vip", "classical", "mix", "acoustic"];

      // Iterate through rows...
      console.log(rows.length);
      for (var rowNum = 0; rowNum < rows.length - 1; rowNum++)
      {
        // Create a copy of the current row
        theRow = rows[rowNum];
        var weight = 1;
        rowMatches = 0;

        // Initialize rowStr values (takes desired track info from the sheet row)
        rowStr = (
          theRow.ID      + " " +
          theRow.Artists + " " +
          theRow.Track   + " "
          ).toLowerCase();

        // EPs, albums, and compilations have a lower weight in terms of search accessibility
        if (theRow.Label.toLowerCase() == "ep" ||
            theRow.Label.toLowerCase() == "album" ||
            theRow.Label.toLowerCase() == "compilation")
        {
          weight = 0.4;
        }

        // Iterate through user args...
        for (var i = 0; i < args.length; i++)
        {
          // ...and check for matches within rows
          if (rowStr.includes(args[i]))
          {
            // Ignore other renditions of a track when uncalled for
            for (var k = 0; k < dupes.length; k++)
            {
              if (rowStr.includes(dupes[k]) && !mergedArgs.includes(dupes[k])) continue;
              anyMatch = true;
              rowMatches += weight;
            }
            // --DEBUG-- Log results
            console.log(`input "${args[i]}" found in row ${x}: ${rowStr}`);
          }
          else continue;
        }

        if (rowMatches != 0)
          matchCounter.push({ row: rowNum, matches: rowMatches });
      }

      // Run if there's a match between args and rowStr
      if (anyMatch)
      {
        var index = 0;

        // --DEBUG-- Weight checking p.1
        //debug = `Initial selection: ${rows[index].Track}`;

        // Use latest entry
        for (var i = 0; i < matchCounter.length; i++)
        {
          if (matchCounter[i].matches > matchCounter[index].matches)
          {
            // --DEBUG-- Weight checking p.2
            //debug += `\nRelease ${rows[i].Artists} - ${rows[i].Track} has a greater weight than ${rows[i].Artists} - ${rows[index].Track}, switching selection`;
            index = i;
          }
        }
        // --DEBUG-- Log weight check
        //console.log(debug);

        // Reassign best match entry
        theRow = rows[matchCounter[index].row];

        // --DEBUG-- Log best match entry
        console.log(theRow.Track);

        // Format acquired data
        embed = await this.client.handler.format(this.client, theRow);
      }
      // Sad violin music
      else return message.reply("I cannot find a match for that search entry.");
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