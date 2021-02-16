const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor (client) 
  {
    super(client, 
    {
      name: 'generate',
      group: 'main',
      memberName: 'generate',
      aliases: ['g'],
      description: 'Generates a mashup based on given criteria.',
      throttling: 
      {
        usages: 1,
        duration: 10
      },
      examples:
      [
        `${client.commandPrefix}generate $t 2`,
        `${client.commandPrefix}generate $t 2 $g dubstep`,
        `${client.commandPrefix}generate $t 2 $g dubstep $b 150`,
        `${client.commandPrefix}generate $t 2 $g dubstep $b 150 $k f min`,
      ]
    });
  }
  
  async run (message)
  {
    // Capture the time at the start of function execution
    const startTime = new Date().getTime();

    // Initialize args and variables
    const embed = new this.client.Discord.MessageEmbed();

    const args = message.content.slice(this.client.commandPrefix.length).toLowerCase().trim().split(/ +/g).splice(1);

    const processedArgs = this.client.handler.processArgs(args, ['t', 'k', 'b', 'g']);

    const numTracks = processedArgs[0] ?? 2,
          
          keyCodes = this.client.keyCodes,
          rows = await this.client.handler.getRows(this.client);
          
    let desiredKey = processedArgs[1],
        desiredBPM = processedArgs[2],
        desiredGenre = processedArgs[3];
    
    try
    {
      // Pick n random releases
      let tracks = [];
      for (let i = 0; i < numTracks; i++)
      {
        //let desired = tracks[0] ?? { "BPM": desiredBPM, "Key": desiredKey };
        let first = tracks[0] ?? { "BPM": undefined, "Key": undefined };
        desiredKey = first.Key ?? desiredKey;
        desiredBPM = desiredBPM ?? first.BPM;
        tracks.push(pickTrack(tracks, rows, desiredGenre, desiredBPM, desiredKey, keyCodes));
      }

      // Sort tracks alphabetically
      tracks.sort((a, b) => (a.Artists + " " + a.Track).localeCompare((b.Artists + " " + b.Track)));

      // Average key and bpm
      let totBPM = 0,
          totKey = 0,
          avgBPM,
          avgKey;

      tracks.forEach(track =>
      {
        totBPM += parseInt(track.BPM);
        totKey += getKeyID(track.Key, keyCodes);
      });
      
      avgBPM = Math.round(totBPM / numTracks);
      avgKey = getMinKey(Math.floor(totKey / numTracks), keyCodes);

      // Add tracks to embed message
      tracks.forEach(track =>
      {
        let keyDiff = getKeyID(avgKey, keyCodes) - getKeyID(track.Key, keyCodes);
        if (keyDiff >= 0) keyDiff = "+" + keyDiff;

        embed.addField(`${track.Artists} - ${track.Track}`, `Key: ${track.Key} (pitch ${keyDiff}), BPM: ${track.BPM}`);
      });
      
      // Initialize variables
      const colors = this.client.colors;
      let color = getGenreColor(desiredGenre, colors);
      
      if (desiredGenre == undefined)
      {
        color = getGenreColor(tracks[0].Label, colors);
        tracks.forEach(track => {
          color = blendColors(color, getGenreColor(track.Label, colors));
        });

        // Randomly sort the array so we can get 2 random, but unique, genres
        tracks.sort(function(){ return Math.random - 0.5 });
        const first = tracks[0].Label;
        const second = tracks[1].Label;

        // Pick a random prefix then add halves of the random genres
        const prefixes = this.client.genrePrefixes;
        desiredGenre = prefixes[Math.floor(Math.random() * prefixes.length)] + first.slice(0, first.length/2) + second.slice(second.length/2);
      }
      
      // Capitalise first letter of each word in desiredGenre
      desiredGenre = desiredGenre.toLowerCase() .split(' ') .map((s) => s.charAt(0).toUpperCase() + s.substring(1)) .join(' ');

      embed
        .setTitle(`${message.author.username}'s ${desiredGenre} mashup in ${avgKey}`)
        .setDescription(`Suggested key: ${avgKey} (${getMajKey(avgKey, keyCodes)})\nSuggested BPM: ${avgBPM}\nGenre: ${desiredGenre}`)
        .setColor(color);
    }
    catch (err)
    {
      await this.client.handler.throw(this.client, err, message);
    }

    // Calculate and report the total run time of the function
    const funcTime = Date.now() - startTime;
    embed.setFooter(`Retrieved in ${funcTime}ms.`, `${this.client.botAvatar}`);

    // Finally send the message
    return message.say(embed);
  }
}

pickTrack = (tracks, rows, desiredGenre = "*", desiredBPM = "*", desiredKey = "*", keyCodes) =>
{
  let track;
  do
  {
    track = rows[Math.floor(Math.random() * rows.length)];
    //console.log(`Validating track: ${track.Track} with key ${track.Key} and BPM ${track.BPM}`);
  } while
    (
      !validGenre(track.Label, desiredGenre) ||
      !validBPM(track.BPM, desiredBPM) ||
      !validKey(track.Key, desiredKey, keyCodes) ||
      tracks.includes(track)
    );
  
  //console.log(`Settled on track: ${track.Track}. Genre: ${genre}`);
  return track;
}

validGenre = (genre, desiredGenre = "*") =>
{
  genre = genre.toLowerCase();

  if (["album", "ep", "compilation", "intro", "miscellaneous", "orchestral", "traditional"].includes(genre)) return false;

  return ((desiredGenre == "*") || (genre == desiredGenre.toLowerCase()));
}

validKey = (key, desiredKey, keyCodes) =>
{
  try
  {
    let keyID = getKeyID(key, keyCodes);
    //console.log(`keyID ${keyID} fetched from key ${key}`);

    return ((desiredKey == "*") || (Math.abs(keyID - getKeyID(desiredKey, keyCodes)) < 3));
  }
  catch(err) { return false; }
}

validBPM = (bpm, desiredBPM) =>
{
  if (isNaN(bpm)) return false;

  bpm = parseInt(bpm);

  return (desiredBPM == "*" || Math.abs(100 - (100 * bpm / desiredBPM)) <= 11);
}

getKeyID = (key, keyCodes) =>
{
  try
  {
    key = key.toLowerCase();
    let keyID = parseInt(keyCodes.find(obj =>
      obj.major.toLowerCase() == key || obj.minor.toLowerCase() == key
    ).keyID);

    return keyID;
  }
  catch(err) { throw err; }
}

getMinKey = (keyID, keyCodes) =>
{
  return keyCodes.find(obj => obj.keyID == keyID).minor;
}

getMajKey = (key, keyCodes) =>
{
  const keyID = getKeyID(key, keyCodes);
  return keyCodes.find(obj => obj.keyID == keyID).major;
}

getGenreColor = (genre = "*", colors) =>
{
  return colors[genre.toLowerCase()] ?? 'b9b9b9';
}

blendColors = (colorA, colorB, amount = 0.5) =>
{
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));

  const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
  const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
  const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');

  return '#' + r + g + b;
}