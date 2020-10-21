// index.js
// Initialize dependencies
const Discord = require("discord.js");
const { CommandoClient } = require('discord.js-commando');

const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

const handler = require("./resources/modules/handler.js");

const config = require("./resources/keys/config.json");
const colors = require("./resources/objects/colors.json");
const keyCodes = require("./resources/objects/keyCodes.json");
const genrePrefixes = require('./resources/objects/genrePrefixes.json');

// const client = new Discord.Client();

// Initialize the Commando client
const client = new CommandoClient(
{  
	commandPrefix: config.prefix,
	owner: [process.env.OWNER_ID, process.env.CO_ID],
  disableEveryone: true,
});

// Bind dependencies to client for sub-unit usage
client.Discord = Discord;

client.gs = GoogleSpreadsheet;
client.fetch = fetch;
client.fs = fs;

client.handler = handler;

client.config = config;
client.colors = colors;
client.keyCodes = keyCodes;
client.genrePrefixes = genrePrefixes;

// Initialize Google Sheets API
const doc = new client.gs(client.config.sheetKey);
client.doc = doc;

// Initialize events
fs.readdir("./events/", (err, files) =>
{
	if (err) return console.error(err);
	files.forEach(file =>
  {
		const event = require(`./events/${file}`);
		let eventName = file.split(".")[0];
		client.on(eventName, event.bind(null, client));
	});
});

// Initialize commands
client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['admin', 'Owner-only commands'],
        ['main', 'Main bot commands'],
        ['util', 'Utility commands'],
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        ping: false,
        help: false,
        unknownCommand: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

// Finally login
client.login(process.env.BOT_TOKEN);