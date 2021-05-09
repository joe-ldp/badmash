const { DiscordAPIError } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'explicit',
      group: 'admin',
      memberName: 'explicit',
      aliases: ['e', 'fuckword'],
      description: 'Checks MCatalog explicit column against Monstercat API',
      examples: [`${client.commandPrefix}explicit`],
      throttling: 
      {
        usages: 1,
        duration: 450
      },
    });
  }

  async run(message)
  {
    // Prevent third-party usage of administrative commands
    if (!(this.client.OWNER_IDS.includes(message.author.id) || process.env.LICENSABILITY_ACCESS.split(",").includes(message.author.id)))
      return message.reply(`You don't have the permission to use this command.`);

    const startTime = new Date().getTime();
  
    const rows = await this.client.handler.getRows(this.client);

    let mcatE, catalogE;
    let res, json, tracks, track, percent = 0, lastPercent = 0;
    let mismatches = [];

    const msg = await message.channel.send(`Scanning for E mismatches... ${percent}% done, ${mismatches.length} detected so far.`);

    try
    {
      //for (let rowNum = 1980; rowNum < 2000; rowNum++)
      for (const [rowNum, row] of rows.entries())
      {
        //const row = rows[rowNum];
        if ((percent = Math.round((rowNum / rows.length) * 100)) > lastPercent)
        {
          msg.edit(`Scanning for E mismatches... ${percent}% done, ${mismatches.length} detected so far.`);
          lastPercent = percent;
        }

        if (["ep", "album", "compilation"].includes(row.Label.toLowerCase())) continue;

        catalogE = row.E == 'E';
        
        try {
          res = await this.client.fetch(`https://connect.monstercat.com/v2/catalog/release/${row.ID}`);
          if (!res.ok) throw "o no";
          json = await res.json();
          tracks = json.tracks;
        } catch(err) { continue; }

        let found = false;
        tracks.forEach(thisTrack =>
        {
          if (row.Track.includes(thisTrack.title)) 
          {
            found = true;
            track = thisTrack;
          }
        });
        if (!found) continue;

        mcatE = track.explicit;

        if (mcatE != catalogE) 
        {
          mismatches.push({row, catalogE, mcatE});
          //console.error(`MISMATCH: ${row.Track}: Catalog CC: ${catalogCC}, MCat CC: ${mcatCC}`);
        }
        else
        {
          //console.log(`MATCH: ${row.Track}: Catalog CC: ${catalogCC}, MCat CC: ${mcatCC}`);
        }
      }
    }
    catch(err)
    {
      await this.client.handler.throw(this.client, err, message);
    }
    
    // Calculate and log the total run time of the function
    const funcTime = Date.now() - startTime;

    let embed;

    mismatches.forEach(async (mm) => {
      embed = new this.client.Discord.MessageEmbed();
      embed.setTitle(`${mm.row.Artists} - ${mm.row.Track}`).setDescription(`MCatalog E: ${mm.catalogE}, MCat E: ${mm.mcatE}`);
      await message.channel.send(embed);
    });
  }
}