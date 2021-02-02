// index.js
// Initialize dependencies
require('dotenv').config();

const Discord = require("discord.js");
const { CommandoClient } = require('discord.js-commando');

const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

const handler = require("./resources/modules/handler.js");

const colors = require("./resources/objects/colors.json");
const keyCodes = require("./resources/objects/keyCodes.json");
const genrePrefixes = require('./resources/objects/genrePrefixes.json');
const contentWarning = require('./resources/objects/contentWarning.json');
const licensability = require('./resources/objects/licensability.json');

var google = require('./resources/keys/google.json');
google.private_key_id = process.env.GOOGLE_PRIVATE_KEY_ID;
google.private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

// Initialize the Commando client
const client = new CommandoClient(
{  
	commandPrefix: process.env.PREFIX,
	owner: [process.env.OWNER_ID, process.env.CO_ID],
  disableEveryone: true,
});

// Bind dependencies to client for sub-unit usage
client.Discord = Discord;

client.gs = GoogleSpreadsheet;
client.google = google;
client.fetch = fetch;
client.fs = fs;

client.handler = handler;

client.colors = colors;
client.keyCodes = keyCodes;
client.genrePrefixes = genrePrefixes;
client.contentWarning = contentWarning;
client.licensability = licensability;

// Initialize Google Sheets API
const doc = new client.gs(process.env.SHEET_KEY);
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