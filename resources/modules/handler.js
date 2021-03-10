mcatJson = async(client, ID) =>
{
  try
  {
    const res = await client.fetch(`https://connect.monstercat.com/v2/catalog/release/${ID}`);
    return await res.json();
  }
  catch(err)
  {
    client.handler.throw(client, err);
  }
}

getCover = async(client, releaseID) =>
{
  const coverRes = await client.fetch(`https://connect.monstercat.com/v2/release/${releaseID}/cover?image_width=512`);

  const coverImage = await (coverRes.ok ? coverRes.url : "https://i.imgur.com/PoFZk7n.png");

  return new client.Discord.MessageAttachment(coverImage, 'cover.jpg');
}

creatorFriendly = async(client, tracks, trackTitle) =>
{
  try
  {
    for (const track of tracks)
    {
      if (trackTitle.includes(track.title))
      {
        return track.creatorFriendly;
      }
    }

    return false;
  }
  catch(err)
  {
    await client.handler.throw(client, err);
  }
}

// Formatting handler for info/random embed
exports.formatInfo = async (client, row) =>
{
  // Initialize Discord embed
  const embed = new client.Discord.MessageEmbed();
  const json = await mcatJson(client, row.ID);
  
  // Find color in colors.json, default (electronic) color if there is no match
  let color = client.colors[row.Label.toLowerCase()] ?? 'b9b9b9';

  // Detect content creator availability and content warnings and mark accordingly
  const CC = await creatorFriendly(client, json.tracks ?? [], row.Track);
  const embedDesc = (client.licensability[CC] ?? client.licensability["default"])
                + "\n"
                + (client.contentWarning[row.E] ?? client.contentWarning["default"]);
  
  const release = json.name !== 'error' ? json.release : {"id": ""};
  const coverImage = await getCover(client, release.id);
  
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
  const doc = client.doc;

  // Create a connection between the bot and the Google sheet
  await doc.useServiceAccountAuth(client.google);
  await doc.loadInfo();
  
  // Automatically find the Catalog sheet. Yay!
  let sheetId = 0;
  doc.sheetsByIndex.forEach(sheet => { if (sheet.title == "Main Catalog") sheetId = sheet.sheetId; });

  // Get the sheet and an obj array containing its rows
  const sheet = doc.sheetsById[sheetId];
  const rows = await sheet.getRows();

  return rows;
}

exports.updateColors = async(client) =>
{
  const colorSheetKey = "1Jlk6YdhYkRayveVV-LlGhtPEhHLptbtkbAu-n6JfxSw";
  const colorSheet = new client.gs(colorSheetKey);

  // Create a connection between the bot and the Google sheet
  await colorSheet.useServiceAccountAuth(client.google);
  await colorSheet.loadInfo();

  // Automatically find the Catalog sheet. Yay!
  let sheetId = 0;
  colorSheet.sheetsByIndex.forEach(sheet => { if (sheet.title == "Genres") sheetId = sheet.sheetId; });

  // Get the sheet and an obj array containing its rows
  const colSheet = colorSheet.sheetsById[sheetId];
  const colRows = await colSheet.getRows();

  let colors = {};
  colRows.forEach(row => { colors[row.Genre.toLowerCase()] = row.Colour.substring(1); });
  
  client.colors = colors;
}

// Custom error handling management
exports.throw = async (client, err, message) =>
{
  await console.error(err);
  
  const errChannel = client.channels.cache.get(process.env.ERROR_CHANNEL);

  const errMsg = `The bot has experienced a critical error. Notifying developers and restarting...`;
  if (message === undefined) errChannel.send(`${errMsg}`);
  else message.errChannel.send(`${errMsg}`);

  if (message !== undefined)
  {
    if (message.channel.type == "dm")
    {
      await errChannel.send(`User ${message.author} experienced an error in **Direct Messages with the bot** at ${message.createdAt}`);
    }
    else if (message.guild.available)
    {
      await errChannel.send(`User ${message.author} experienced an error in **${message.guild.name}**: #${message.channel.name} at ${message.createdAt}`);
      await errChannel.send(`Link: https://discordapp.com/channels/${message.author.id}/${message.channel.id}/${message.id}`);
    }
    else
    {
      await errChannel.send(`User ${message.author} experienced an error in **an unknown DM or Guild** at ${message.createdAt}`);
    }
    await errChannel.send(`Command issued: \`\`\`${message.content}\`\`\``);
  }

  await errChannel.send(`Error encountered: \`\`\`${err}\`\`\``);
  
  process.exit(err.code);
}

// Picks a random color from colors
exports.colorize = (client) =>
{
  const vals = Object.values(client.colors);
  return vals[Math.floor(Math.random() * vals.length)];
}

exports.processArgs = (argv, keys) =>
{
  let currentArg, thisArg, processedArgs = [];
  
  for (let i = 0; i < argv.length; i++)
  {
    currentArg = argv[i], thisArg = "";

    if (currentArg[0] === '$')
    {
      for (let j = i + 1; j < argv.length; j++)
      {
        if (argv[j][0] === '$') break;
        thisArg += argv[j] + " ";
      }

      if (keys.includes(currentArg.slice(1))) processedArgs.push(thisArg.trim());
    }
  }

  return processedArgs;
}
