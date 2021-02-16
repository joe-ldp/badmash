// reboot.js
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
    constructor(client)
    {
        super(client,
        {
            name: 'say',
            group: 'admin',
            memberName: 'say',
            description: 'Sends a message in the given channel',
            examples: [`${client.commandPrefix}say 535282119791083520 you suck`]
        });
    }

    async run(message)
    {
        // Prevent third-party usage of administrative commands
        if (!(message.author.id == process.env.OWNER_ID || message.author.id == process.env.CO_ID))
            return message.reply(`You don't have the permission to use this command.`);

        const args = message.content.slice(this.client.commandPrefix.length).toLowerCase().trim().split(/ +/g).splice(1);

        if (args.length === 0) return message.reply("You entered nothing.");

        try
        {
          const chl = this.client.channels.cache.get(args.splice(0, 1).join(""));
          const msg = args.join(" ");

          await chl.send(`${msg}`).catch(console.error);
        }
        catch (err)
        {
            await this.client.handler.throw(this.client, err, message);
        }
    }
}