getCover = async(client, ID) =>
{
  // Initialize variables for fetching the cover art from the Monstercat API
  var releaseID;

  // Embed uses default image (Monstercat logo) if fetching fails
  var defaultImage = "https://i.imgur.com/PoFZk7n.png";
  var coverImage;

  // Fetch the release ID from the Monstercat API
  await client.fetch(`https://connect.monstercat.com/v2/catalog/release/${ID}`)
    .then(res => res.json())
    .then(json => (releaseID = json.release.id))
    .then(async() =>
    {
      const coverURL = await client.fetch(`https://connect.monstercat.com/v2/release/${releaseID}/cover?image_width=512`);
      coverImage = await coverURL.buffer();
    })
    .catch(err => 
    {
      console.error(err);
      coverImage = defaultImage;
    });  

  const attachment = new client.Discord.MessageAttachment(coverImage, 'cover.jpg');

  return attachment;
}

// Formatting handler for lookup embed
exports.format = async (client, row) =>
{
  // Initialize Discord embed
  const embed = new client.Discord.MessageEmbed();
  
  // Find color in colors.json, default (electronic) color if there is no match
  let color = client.colors[row.Label.toLowerCase()] ?? 'b9b9b9';

  // Detect content creator availability and content warnings and mark accordingly
  let embedDesc = (client.licensability[row.CC] ?? client.licensability["default"])
                + "\n"
                + (client.contentWarning[row.E] ?? client.contentWarning["default"]);
  
  let coverImage = await getCover(client, row.ID);
  
  // Build the embed
  embed
    .setColor(color)
    .setTitle(`${row.Track}`)
    .setDescription(`by **${row.Artists}**\n${embedDesc}`)  
    .setURL(`https://monstercat.com/release/${row.ID}`)
    
    .addField(`**Genre:**`,            `${row.Label}`)
    
    .addField(`**Catalog:**`,          `${row.ID}`, true)
    .addField(`**Date:**`,             `${row.Date}`, true)
    .addField(`**Compilation:**`,      `${row.Comp}`, true)

    .addField(`**BPM:**`,              `${row.BPM}`, true)
    .addField(`**Key:**`,              `${row.Key}`, true)
    .addField(`**Length:**`,           `${row.Length}`, true)
  
    .attachFiles(coverImage)
    .setThumbnail('attachment://cover.jpg')
  ;
  
  // Return the formatted embed
  return embed;
}

mapGet = (map, key) =>
{
  if (map.has(key)) return map.get(key);
  else return map.get("default");
}

// Custom error handling management
exports.throw = async (client, message, err) =>
{
  // Error log
  console.error(err);

  // Error notification
  message.channel.send(`The bot has experienced a critical error. Notifying developers and restarting...`);

  // Send error log in bot HQ
  const channel = client.channels.cache.get('725111207337525369');

  if (message.channel.type == "dm")
  {
    await channel.send(`User ${message.author} experienced an error in **Direct Messages with the bot** at ${message.createdAt}`);
  }
  else if (message.guild.available)
  {
    await channel.send(`User ${message.author} experienced an error in **${message.guild.name}**: #${message.channel.name} at ${message.createdAt}`);
    await channel.send(`Link: https://discordapp.com/channels/${message.author.id}/${message.channel.id}/${message.id}`);
  }
  else
  {
    await channel.send(`User ${message.author} experienced an error in **an unknown DM or Guild** at ${message.createdAt}`);
  }

  await channel.send(`Command issued: \`\`\`${message.content}\`\`\``);
  await channel.send(`Error encountered: \`\`\`${err}\`\`\``);
  await console.error(err);
  
  // Reboot
  process.exit(1);
}

// Picks a random color from colors.json
exports.colorize = (client) =>
{
  return client.colors[Math.floor(Math.random() * client.colors.length)].color;
}

exports.processArgs = (argv, keys) =>
{
  var currentArg, thisArg, processedArgs = [];

  for (var i = 0; i < argv.length; i++)
  {
    currentArg = argv[i], thisArg = "";

    if (currentArg[0] == '$')
    {
      for (var j = i + 1; j < argv.length; j++)
      {
        if (argv[j][0] == '$') break;
        thisArg += argv[j] + " ";
      }
      
      thisArg = thisArg.trim();

      for (var j = 0; j < keys.length; j++)
      {
        if (currentArg.slice(1) == keys[j])
        {
          processedArgs[j] = thisArg;
        }
      }
    }
  }

  return processedArgs;
}