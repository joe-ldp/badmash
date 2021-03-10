const { Command } = require('discord.js-commando');

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
    const args = message.content.slice(this.client.commandPrefix.length).toLowerCase().trim().split(/ +/g).splice(1);
    if (args.length === 0) return message.reply("You entered nothing.");
    
    const startTime = new Date().getTime();
    
    const rows = await this.client.handler.getRows(this.client);
    let embed;

    try {
      const row = search(rows, args);
      embed = await this.client.handler.formatInfo(this.client, row);
    }
    catch (err) {
      if (err === "no_match") return message.reply("I cannot find a match for that search entry.");
      else await this.client.handler.throw(this.client, err, message);
    }

    const funcTime = Date.now() - startTime;
    embed.setFooter(`Retrieved in ${funcTime}ms.`, `${this.client.botAvatar}`);

    message.channel.send(embed);
  }
}

search = (rows, args) =>
{
  let matchCounter = [];
  const mergedArgs = args.join(" "),
        dupes = ["remix", "remixes", "remake", "vip", "classical", "mix", "acoustic", "+"],
        reduceWeight = ["ep", "album", "compilation"];
  

  for (const [rowNum, row] of rows.entries())
  {
    let weight = 1, rowMatches = 0;

    const searchFields = [
      row.ID, row.Date, row.Label, row.Artists, row.Track, row.Comp, row.Length, row.BPM, row.Key
    ].map(v => v.toLowerCase()),
          searchFieldsJoined = searchFields.join(" ");

    if (dupes.some((dupe) => searchFieldsJoined.includes(dupe) && !mergedArgs.includes(dupe))) continue;

    // EPs, albums, and compilations have a lower weight
    if (reduceWeight.includes(row.Label.toLowerCase())) weight = 0.5;

    args.forEach(arg =>
    {
      if (searchFieldsJoined.includes(arg))
      {
        dupes.forEach(dupe =>
        {
          if (searchFields.includes(dupe) && !mergedArgs.includes(dupe)) return;
          rowMatches += weight;
        });
      }
    });
    
    /*args.forEach(arg => {
      if (searchFieldsJoined.includes(arg)) {
        rowMatches += weight;
      }
        
      // for (let i = 0; i < searchFields.length; i++) {
      //   for (let j = i; j < (searchFields.length - i); j++) {
      //     let field = "";
      //     for (let k = j; k < (searchFields.length - k); k++) {
      //       field += searchFields[k] + " ";
      //     }
      //     field = field.trim();
      //     console.log(field);

      //     if (field === arg) rowMatches += (weight * j);
      //     if (field === mergedArgs) rowMatches += (weight * j);
      //   }
      // }

      // for (let index = 0; index < searchFieldsJoined.split(/ +/g).length; index++) {
      //   let element = "";
      //   for (let jindex = index; jindex < searchFieldsJoined.split(/ +/g).length; jindex++) {
      //     element += searchFieldsJoined.split(/ +/g)[jindex] + " ";
      //     if (arg === element) rowMatches += weight * 2;
      //     if (mergedArgs === element) rowMatches += weight * 3;
      //     console.log(element);
      //   }
      // }
      
      for (const field of searchFields) {
        if (arg === field) rowMatches += weight * 2;
        if (mergedArgs === field) rowMatches += weight * 5;
        console.log(field);
      }

      
    });*/

    if (rowMatches) matchCounter.push({ row: rowNum, matches: rowMatches, name: row.Track });
  }

  if (matchCounter.length)
  {
    let index = 0;
    for (let i = 0; i < matchCounter.length; i++) {
      if (matchCounter[i].matches > matchCounter[index].matches) index = i;
    }

    return rows[matchCounter[index].row];
  }
  // Sad violin music
  else throw "no_match";
}