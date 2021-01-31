// generate.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

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
            examples: [
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
    var startTime = new Date().getTime();

    // Initialize args and variables
    var args = message.content.slice(this.client.commandPrefix.length).trim().split(/ +/g).map(v => v.toLowerCase());
    args.shift();

    // Set defaults
    var numTracks = 2,
        desiredKey = "*",
        desiredBPM = "*",
        desiredGenre = "*";

    // Process args to determine user settings
    const keys = ['t', 'k', 'b', 'g'];
    const processedArgs = this.client.handler.processArgs(args, keys);
    
    for (var i = 0; i < processedArgs.length; i++)
    {
      if (processedArgs[i] == undefined) continue;
      else
      {
        switch(i)
        {
          case 0: numTracks = processedArgs[i]; break;
          case 1: desiredKey = processedArgs[i]; break;
          case 2: desiredBPM = processedArgs[i]; break;
          case 3: desiredGenre = processedArgs[i]; break;
        }
      }
    }

    //message.say(`${processedArgs}`);
    //message.say(`${numTracks}, ${desiredKey}, ${desiredBPM}, ${desiredGenre}`);
    
    getRows = require('./resources/modules/rows.js');
    const rows = getRows();
    
    // Big try/catch purely to spam ping Hanabi when you're debugging a crashing issue
    try
    {
      // Pick n random releases
      var tracks = [];
      for (let i = 0; i < numTracks; i++)
      {
        tracks.push(pickTrack(rows, desiredBPM, desiredGenre, desiredKey));
      }

      var totBPM = 0, totKey = 0, avgBPM, avgKey, keyDiff;
      // Sort tracks alphabetically
      tracks.sort((a, b) => (a.Artists + " " + a.Track).localeCompare((b.Artists + " " + b.Track)));

      // Sum keys and bpms for averaging
      tracks.forEach(track =>
      {
        //message.say(`${track.Label}, ${track.Key}, ${track.BPM}`);
        totBPM += parseInt(track.BPM);
        totKey += getKeyID(track.Key);
      });

      // Calculate average BPM and Key
      avgBPM = Math.round(totBPM / numTracks);
      avgKey = getKeyFromID(Math.floor(totKey / numTracks));

      tracks.forEach(track =>
      {
        keyDiff = getKeyID(avgKey) - getKeyID(track.Key);
        if (keyDiff >= 0) keyDiff = "+" + keyDiff;

        embed.addField(`${track.Artists} - ${track.Track}`, `Key: ${track.Key} (pitch ${keyDiff}), BPM: ${track.BPM}`);
      });
      
      // Initialize variables
      var color = 'b9b9b9';
      var colors = this.client.colors;

      if (desiredGenre != "*")
      {
        try {
          color = getGenreColor(desiredGenre, colors);
        } catch(err) { }
      }
      else
      {
        color = getGenreColor(tracks[0].Label, colors);
        for (let i = 1; i < tracks.length; i++)
        {
          color = blendColors(color, getGenreColor(tracks[i].Label, colors));
        }
      }

      var mashupGenre = desiredGenre.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

      if (mashupGenre == "*")
      {
        const first = tracks[Math.floor(Math.random() * tracks.length)].Label;
        const second = tracks[Math.floor(Math.random() * tracks.length)].Label;

        let prefixes = this.client.genrePrefixes;
        mashupGenre = prefixes[Math.floor(Math.random() * prefixes.length)];
        mashupGenre += first.slice(0, first.length/2);
        mashupGenre += second.slice(second.length/2);
      }

      // Embed formatting
      embed
      .setTitle(`${message.author.username}'s ${mashupGenre} mashup in ${avgKey}`)
      .setDescription(`Suggested key: ${avgKey} (${getMajKey(avgKey)})\nSuggested BPM: ${avgBPM}\nGenre: ${mashupGenre}`)
      .setColor(color)
      ;
    }
    catch (err)
    {
      // Inform bot owner for error, send error log, and log it
      this.client.handler.throw(this.client, message, err);
    }

    // Get the bot's avatar
    const botAvatar = this.client.users.cache.get(process.env.BOT_ID).avatarURL();

    // Calculate and report the total run time of the function
    var funcTime = Date.now() - startTime;
    embed.setFooter(`Retrieved in ${funcTime}ms.`, `${botAvatar}`);

    // Finally send the message
    return message.say(embed).catch(console.error);

    function getKeyID(key)
    {
      try
      {
        key = key.toLowerCase();

        var keyID = parseInt(keyCodes.find(obj =>
          obj.major.toLowerCase() == key || obj.minor.toLowerCase() == key
        ).keyID);

        //console.log(key, keyID);
        return keyID;
      }
      catch(err)
      {
        //console.log(err);
      }
    }

    function getKeyFromID(keyID)
    {
      var key = keyCodes.find(obj => obj.keyID == keyID).minor;
      //console.log(keyID, key);
      return key;
    }

    function getMajKey(key)
    {
      var keyID = getKeyID(key);
      var maj = keyCodes.find(obj => obj.keyID == keyID).major;
      //console.log(keyID, key);
      return maj;
    }

    function pickTrack(rows, desiredBPM, desiredGenre, desiredKey)
    {
      var track;
      for (var i = 0; i < rows.length; i++) 
      {
        track = rows[Math.floor(Math.random() * rows.length)];

        //console.log(`Validating track: ${track.Track} with key ${track.Key} and BPM ${track.BPM}`);

        if (validTrack(track, desiredBPM, desiredGenre, desiredKey))
        {
          //console.log(`Settled on track: ${track.Track}. Genre: ${genre}`);
          return track;
        }
      }
      
      //console.log(`Defaulted to track: ${track.Track}. Genre: ${genre}`);
      return track;
    }

    function validTrack(track, desiredBPM, desiredGenre, desiredKey)
    {
      if (
        validGenre(track.Label, desiredGenre) &&
        validKey(track.Key, desiredKey) &&
        validBPM(track.BPM, desiredBPM)
      )
      {
        //console.log("Track validated");
        return true;
      }
      else
      {
        //console.log("Track invalidated");
        return false;
      }
    }

    function validGenre(genre)
    {
      genre = genre.toLowerCase();
      if (genre != "album" &&
          genre != "ep" &&
          genre != "compilation" &&
          genre != "intro" &&
          genre != "miscellaneous" &&
          genre != "orchestral" &&
          genre != "traditional")
      {
        if (desiredGenre == "*")
        {
          return true;
          //console.log("Valid genre detected");
        }
        else if (genre == desiredGenre)
        {
          return true;
          //console.log("Valid genre detected");
        }
        else
        {
          return false;
        }
      }
      else
      {
        return false;
      }
    }

    function validKey(key, desiredKey)
    {
      try
      {
        var keyID = getKeyID(key);
        //console.log(`keyID ${keyID} fetched from key ${key}`);

        var keyBruh = getKeyFromID(keyID);
        //console.log(`key ${keyBruh} fetched from keyID ${keyID}`);

        if (desiredKey == "*" || Math.abs(keyID - getKeyID(desiredKey)) < 2)
        {
          return true;
          //console.log(`Valid key detected`);
        }
        else
        {
          return false;
          //console.log(`Valid key detected`);
        }
      }
      catch(err)
      {
        //console.error(err);
        //console.log("Invalid key detected");
        return false;
      }
    }

    function validBPM(bpm, desiredBPM)
    {
      try
      {
        //console.log(bpm, typeof bpm, isNaN(bpm));
        //bpm = parseInt(bpm, 10);
        //console.log(bpm, typeof bpm, isNaN(bpm));
        

        if (!isNaN(bpm))
        {
          //console.log(Math.abs(100-(100*bpm/desiredBPM)));
          bpm = parseInt(bpm);
          if (desiredBPM == "*" || Math.abs(100 - (100 * bpm / desiredBPM)) <= 12)
          {
            //console.log("Valid BPM detected");
            return true;
          }
          else
          {
            //console.log("Invalid BPM detected");
            return false;
          }
        }
        else
        {
          //console.log("Invalid BPM detected");
          return false;
        }
      }
      catch(err)
      {
        return false;
      }
    }

    function getGenreColor(genre, colors)
    {
      return colors.find(obj => obj.genre.toLowerCase() == genre.toLowerCase()).color;
    }

    // REPLACE THIS FUNCTION MAYBE
    function blendColors(colorA, colorB, amount = 0.5)
    {
      const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
      const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));

      const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
      const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
      const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');

      return '#' + r + g + b;
    }
  }
}