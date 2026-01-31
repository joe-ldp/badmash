require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const coloursJson = './resources/objects/colours.json';
if (!fs.existsSync(coloursJson)) {
	fs.writeFileSync(coloursJson, JSON.stringify({}));
}
client.colours = require(coloursJson);

const genresJson = './resources/objects/genres.json';
if (!fs.existsSync(genresJson)) {
	fs.writeFileSync(genresJson, JSON.stringify([]));
}
client.genres = require(genresJson);

const { googleAuth, getMcatalogSheet } = require('./resources/modules/sheet.js');
const { updateColours } = require('./resources/modules/colour.js');

googleAuth(client);

getMcatalogSheet(client.google).then((sheet) => {
	client.sheet = sheet;
	console.log('MCatalog sheet connection ready');
	updateColours(client);
});

client.cooldowns = new Collection();

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.DISCORD_BOT_TOKEN);