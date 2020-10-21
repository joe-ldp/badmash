// reboot.js
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'reboot',
      group: 'admin',
      memberName: 'reboot',
      description: 'Reboots the bot',
      examples: [`${client.commandPrefix}reboot`]
    });
  }

  async run(message)
  {
    // Prevent third-party usage of administrative commands
    if (!(message.author.id == process.env.OWNER_ID || message.author.id == process.env.CO_ID))
      return message.reply(`You don't have the permission to use this command.`);

    // Initialize rebooting sequence
    await message.channel.send("***Restarting...***").catch(console.error);
    await console.log("Bot has initiated a reboot. Rebooting...");

    // Reboot the bot
    process.exit(1);
  }
}