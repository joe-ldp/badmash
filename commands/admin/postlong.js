// reboot.js
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'postlong',
      group: 'admin',
      memberName: 'postlong',
      description: 'Posts ALL info about a (new) release in a channel',
      examples: [`${client.commandPrefix}post`]
    });
  }

  async run(message)
  {
    // Prevent third-party usage of administrative commands
    if (!this.client.OWNER_IDS.includes(message.author.id))
      return message.reply(`You don't have the permission to use this command.`);

    const args = message.content.slice(this.client.commandPrefix.length).toUpperCase().trim().split(/ +/g).splice(1);
    if (args.length != 2) return message.reply("Please enter a release ID and channel ID.");

    const ID = args[0];
    const postChannel = args[1];

    // Initialize Discord embed
    const embed = new this.client.Discord.MessageEmbed();
    const json = await mcatJson(this.client, ID);
    const release = json.release;
    
    // Find color in colors.json, default (electronic) color if there is no match
    let color = this.client.colors[release.genreSecondary.toLowerCase()] ?? 'b9b9b9';
  
    // Detect content creator availability and content warnings and mark accordingly
    //const CC = await creatorFriendly(this.client, json.tracks ?? [], row.Track);
    /*const embedDesc = (this.client.licensability[release.explicit] ?? this.client.licensability["default"])
                  + "\n"
                  + (this.client.contentWarning[row.E] ?? this.client.contentWarning["default"]);*/
    
    //const release = json.name !== 'error' ? json.release : {"id": ""};
    const coverImage = await this.client.handler.getCover(this.client, release.id);

    

    let releaseTypeAddon = release.type == "EP" ? "EP" : release.type == "Album" ? "LP" : "";

    let d = new Date(Date.parse(release.releaseDate));
    let releaseDate = this.client.dateformat(d, "ddd dS mmm yyyy");

    // Build the embed
    embed
      .setColor(color)
      .setTitle(`${release.artistsTitle} - ${release.title} ${releaseTypeAddon}`)
      .setURL(`https://monstercat.com/release/${ID}`)
      
      .addField(`**Primary Genre:**`, `${release.genreSecondary}`)
      
      .addField(`**Catalog ID:**`,    `${ID}`, true)
      .addField(`**Release Type:**`,  `${release.type}`, true)

      .addField(`**Release Date:**`,  `${releaseDate}`, false)

      .attachFiles(coverImage)
      .setThumbnail('attachment://cover.jpg')
    ;

    let tracklist = ``;
    json.tracks.forEach(track => {
      let title = `${track.trackNumber}. ${track.artistsTitle} - ${track.title}`;
      let info = `Brand: ${track.Brand}\nLicensable: ${track.creatorFriendly}\nDownloadable: ${track.downloadable}\nDuration: ${track.duration}s\nExplicit: ${track.explicit}\nPrimary Genre: ${track.genrePrimary}\nSecondary Genre: ${track.genreSecondary}`;
      embed.addField(`**${title}**`, `${info}`);
    });

    try
    {
      const chl = this.client.channels.cache.get(postChannel);

      await chl.send(embed).catch(console.error);
    }
    catch (err)
    {
        await this.client.handler.throw(this.client, err, message);
    }
  }
}