// roulette.js
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const prompter = require('discordjs-prompter');

module.exports = class extends Command
{
    constructor (client) 
    {
        super(client, 
        {
            name: 'roulette',
            group: 'main',
            memberName: 'roulette',
            //aliases: [],
            description: 'mostrino.',
            examples: [`${client.commandPrefix}roulette`],
        });
    }
  
    async run (message)
    {
        // Initialize args
        const args = message.content.slice(this.client.commandPrefix.length).trim().split(/ +/g);
        args.shift();

        // Create a connection between the bot and the Google sheet
        const doc = this.client.doc;
        await doc.useServiceAccountAuth(client.google);
        await doc.loadInfo();

        var track;
        const channel = message.channel;
    
        // Big try/catch purely to spam ping Hanabi when you're debugging a crashing issue
        try
        {
            // Automatically find the Catalog sheet. Yay!
            var sheetId = 0;
            doc.sheetsByIndex.forEach(x => {
                if (x.title == "Catalog") sheetId = x.sheetId;
            });

            // Get the sheet and an obj array containing its rows
            const sheet = doc.sheetsById[sheetId];
            const rows = await sheet.getRows();

            
            var score = 10;
            var tracks = [];
            
            while (score > 3)
            {
                track = randomTrack(rows);

                await prompter.
                message(message.channel,
                {
                    question: `What score would you give ${track.Artists} - ${track.Track}?`,
                    //choices: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
                    max: 1,
                    userId: message.author.id,
                    timeout: 10000,
                    
                })
                .then(responses =>
                {
                    console.log(parseInt(responses.first()));
                    let res = parseInt(responses.first());

                    console.log(res, isNaN(res), parseInt(res), isNaN(parseInt(res)));

                    if (res == null || isNaN(res) || parseInt(res) == NaN)
                    {
                        //score = -1;
                        return channel.send("Illegal input / waited too long!");
                        //break;
                    }
                    else
                    {
                        score = parseInt(res);
                        tracks.push({"track": track, "score": res});
    
                        //channel.send(`${score}`);
                    }
                });
            }
            
            tracks.forEach(tr =>
            {
                message.channel.send(`${tr.track.Track} - ${tr.score}`);
            });
        }
        catch (err)
        {
            // Inform bot owner for error, send error log, and log it
            this.client.handler.throw(this.client, message, err);
        }

        function randomTrack(rows)
        {
            var genre;
            do
            {
                track = rows[Math.floor(Math.random() * rows.length)];
                genre = track.Genre.toLowerCase();
            } 
            while 
            (
                genre == "album" ||
                genre == "ep" ||
                genre == "compilation"
            );
    
            return track;
        }
    }

}