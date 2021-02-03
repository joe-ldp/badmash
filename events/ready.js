// ready.js
module.exports = (client, ready) =>
{
	console.log(`MCatalog Bot v. ${process.env.VERSION} -- Username: ${client.user.username}`);
  console.log(`Currently serving ${client.guilds.cache.size} servers and ${client.users.cache.size} members`);
  client.channels.cache.get("535282119791083520").send(`${client.user.username} is online.`);
	client.user.setActivity(`rebrand.ly/mcatalog`, {type:"WATCHING"});
}