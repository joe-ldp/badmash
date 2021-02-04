getCover = async(client, ID) =>
{
  // Embed uses default image (Monstercat logo) if fetching fails
  let defaultImage = "https://i.imgur.com/PoFZk7n.png";
  var coverImage;

  // Fetch the cover art from the Monstercat API
  try
  {
    let res = await client.fetch(`https://connect.monstercat.com/v2/catalog/release/${ID}`);
    let json = await res.json();
    let releaseID = json.release.id;

    let coverRes = await client.fetch(`https://connect.monstercat.com/v2/release/${releaseID}/cover?image_width=512`);
    coverImage = await coverRes.buffer();
  }
  catch(err)
  {
    console.error(err);
    coverImage = defaultImage;
  }

  return new client.Discord.MessageAttachment(coverImage, 'cover.jpg');
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

exports.getRows = async (client) =>
{
    // Redefine the 'doc' (sheet) for easier access, initialize Discord embed
    const doc = client.doc;

    // Create a connection between the bot and the Google sheet
    await doc.useServiceAccountAuth(client.google);
    await doc.loadInfo();

    // Automatically find the Catalog sheet. Yay!
    var sheetId = 0;
    doc.sheetsByIndex.forEach(x => {
        if (x.title == "Catalog") sheetId = x.sheetId;
    });

    // Get the sheet and an obj array containing its rows
    const sheet = doc.sheetsById[sheetId];
    const rows = await sheet.getRows();

    return rows;
}

exports.updateColors = async(client) =>
{
  var colorSheetKey = "1Jlk6YdhYkRayveVV-LlGhtPEhHLptbtkbAu-n6JfxSw";
  var colorSheet = new client.gs(colorSheetKey);

  // Create a connection between the bot and the Google sheet
  await colorSheet.useServiceAccountAuth(client.google);
  await colorSheet.loadInfo();

  // Automatically find the Catalog sheet. Yay!
  var sheetId = 0;
  colorSheet.sheetsByIndex.forEach(x => {
      if (x.title == "Genres") sheetId = x.sheetId;
  });

  // Get the sheet and an obj array containing its rows
  const colSheet = colorSheet.sheetsById[sheetId];
  const colRows = await colSheet.getRows();

  var colors = {};
  colRows.forEach(row =>
  {
    //colors.push([row.Genre.toLowerCase(), row.Colour.substring(1)]);
    colors[row.Genre.toLowerCase()] = row.Colour.substring(1);
  });
  
  client.colors = colors;
}

// Custom error handling management
exports.throw = async (client, message, err) =>
{
  console.error(err);

  message.channel.send(`The bot has experienced a critical error. Notifying developers and restarting...`);

  const channel = client.channels.cache.get(process.env.ERROR_CHANNEL);

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

  console.log(err.headers);
  
  process.exit(err.code);
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