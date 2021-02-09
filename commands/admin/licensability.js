const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'licensability',
      group: 'admin',
      memberName: 'licensability',
      aliases: ['l', 'cc'],
      description: 'Checks MCatalog licensability column against Monstercat API',
      examples: [`${client.commandPrefix}licensability`],
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
    if (!([process.env.OWNER_ID, process.env.CO_ID].includes(message.author.id) || process.env.LICENSABILITY_ACCESS.split(",").includes(message.author.id)))
      return message.reply(`You don't have the permission to use this command.`);

    var startTime = new Date().getTime();
  
    const rows = await this.client.handler.getRows(this.client);

    let mcatCC, catalogCC;
    let res, json, tracks, track, percent = 0, lastPercent = 0;
    let mismatches = [];

    const msg = await message.channel.send(`Scanning for CC errors... ${percent}% done, ${mismatches.length} detected so far.`);

    try
    {
      for (let i = 0; i < rows.length; i++)
      {
        if ((percent = Math.round((i / rows.length) * 100)) > lastPercent)
        {
          msg.edit(`Scanning for CC errors... ${percent}% done, ${mismatches.length} detected so far.`);
          lastPercent = percent;
        }

        const row = rows[i];

        if (["ep", "album", "compilation"].includes(row.Label.toLowerCase())) continue;

        catalogCC = row.CC == 'Y';
        
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

        mcatCC = track.creatorFriendly;

        //console.log(mcatCC == catalogCC);
        if (mcatCC != catalogCC) 
        {
          mismatches.push(`${row.Track}: Catalog CC: ${catalogCC}, MCat CC: ${mcatCC}`);
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
      await this.client.handler.throw(this.client, message, err);
    }
    
    // Calculate and log the total run time of the function
    const funcTime = Date.now() - startTime;
    
    console.log(mismatches);
    // Finally send the message
    for (let i = 0; i < mismatches.length; i++)
    {
      const mm = mismatches[i];
      await message.channel.send(mm);
    }
  }
}