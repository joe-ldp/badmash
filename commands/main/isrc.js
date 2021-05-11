// reboot.js
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'isrc',
      group: 'main',
      memberName: 'isrc',
      description: 'Returns the ISRCs from a release.',
      examples: [`${client.commandPrefix}isrc MCEP187`, `${client.commandPrefix}isrc MCS482`]
    });
  }

  async run(message)
  {
    const args = message.content.slice(this.client.commandPrefix.length).toUpperCase().trim().split(/ +/g).splice(1);

    const ID = args[0];

    // Initialize Discord embed
    const embed = new this.client.Discord.MessageEmbed();

    const json = await mcatJson(this.client, ID);
    const release = json.release;

    const color = this.client.colors[release.genreSecondary.toLowerCase()] ?? 'b9b9b9';
    
    const coverImage = await this.client.handler.getCover(this.client, release.id);
    
    const releaseTypeAddon = release.type == "EP" ? "EP" : release.type == "Album" ? "LP" : "";

    const d = new Date(Date.parse(release.releaseDate));
    const releaseDate = this.client.dateformat(d, "ddd dS mmm yyyy");
    
    let isrcList = [];
    json.tracks.forEach(track => {
      const version = track.version == '' ? '' : `(${track.version})`;
      isrcList.push([`${track.trackNumber}. ${track.artistsTitle} - ${track.title} ${version}`, `ISRC: **${track.isrc}**`]);
    });
    

    // Build the embed
    embed
      .setColor(color)
      .setTitle(`${release.artistsTitle} - ${release.title} ${releaseTypeAddon}`)
      .setURL(`https://monstercat.com/release/${ID}`)

      .addField(`**Catalog ID:**`,    `${ID}`, true)
      .addField(`**Release Type:**`,  `${release.type}`, true)
      .addField(`**Release Date:**`,  `${releaseDate}`, true)

      .attachFiles(coverImage)
      .setThumbnail('attachment://cover.jpg')
    ;

    isrcList.forEach(track => {
      embed.addField(track[0], track[1]);
    });

    try
    {
      await message.channel.send(embed).catch(console.error);
    }
    catch (err)
    {
        await this.client.handler.throw(this.client, err, message);
    }
  }
}