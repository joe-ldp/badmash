// Formatting handler for lookup embed
exports.format = async (client, row) =>
{
  // Initialize Discord embed
  const embed = new client.Discord.MessageEmbed();
  
  // Initialize variables
  var colors = client.colors,
      genre = row.Label,
      color = 'b9b9b9';

  // Cycle through the colors in colors.json to find a match, bot uses default color if there is no match
  try 
  { 
    color = colors.find(obj => obj.genre.toLowerCase() == genre.toLowerCase()).color;
  } catch (err) { /* Do nothing */ }
  
  // Initialize and build the embed description
  var embedDesc;
  
  // Detect content creator availability and mark accordingly
  switch (row.CC)
  {
    case 'Y': embedDesc = `✅ Safe for content creators`; break;
    default:  embedDesc = `⚠️ Not safe for content creators`; break;
  }
  
  // Detect explicit content and mark accordingly
  switch (row.E)
  {
    case 'E': // Explicit
      embedDesc += `\n⚠️ Explicit content`; break;

    case 'C': // Clean
    case 'I': // Instrumental
      embedDesc += `\n✅ No explicit content`; break;

    default: // Other / unknown / unmarked
      embedDesc += `\n⚠️ Possible explicit content`; break;
  }

  // Initialize variables for fetching the cover art from the Monstercat API
  var releaseID, imageURL;

  // Embed uses default image (Monstercat logo) if fetching fails
  var defaultImage = "https://i.imgur.com/PoFZk7n.png";

  // Fetch the release ID from the Monstercat API
  await client.fetch(`https://connect.monstercat.com/v2/catalog/release/${row.ID}`)
    .then(res => res.json())
    .then(json => (releaseID = json.release.id))
    .catch(err => console.error(err));

  // --DEBUG-- log the track's release ID (not to be confused with the catalog ID)
  // console.log(releaseID);

  // Fetch the cover art URL from AWS
  await client.fetch(`https://connect.monstercat.com/v2/release/${releaseID}/cover?image_width=3000`)
    .then(res => (imageURL = res.url.split("?")[0]))
    .catch(err => console.error(err));

  var image;
  await client.fetch(`https://connect.monstercat.com/v2/release/${releaseID}/cover?image_width=3000`)
    .then(res => (image = res))
    .catch(err => console.error(err));

  var imageBuffer;
  imageBuffer = await image.buffer();
 
  
  // --DEBUG-- Log the fetched image URL
  // console.log(imageURL);

  // Set the embed thumbnail to the track's cover art, or to the default image if fetching fails
  
  if (!releaseID) embed.setThumbnail(`${defaultImage}`);
  else embed.setThumbnail(`${imageURL}`);
  
  // --DEBUG-- Log embed.thumbnail if it exists
  //console.log(embed.thumbnail);
  
  // Set the embed thumbnail to the default image, if the bot fails to use the cover art for some fucking reason
  if (!embed.thumbnail) embed.setThumbnail(`${defaultImage}`);
  
  // --DEBUG-- Send a copy of the cover art on Discord
  client.channels.cache.get("535282119791083520").send(`${imageURL}`);
  client.channels.cache.get("535282119791083520").send(imageBuffer);
  console.log(imageBuffer);
  
  
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
  ;
  
  // Return the formatted embed
  return embed;
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