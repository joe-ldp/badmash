// ready.js
module.exports = (client, ready) =>
{
	console.log(`MCatalog Bot v. ${process.env.VERSION} -- Username: ${client.user.username}`);
  console.log(`Currently serving ${client.guilds.cache.size} servers and ${client.users.cache.size} members`);
  client.channels.cache.get(process.env.UPTIME_CHANNEL).send(`${client.user.username} is online.`);
  client.user.setActivity(`rebrand.ly/mcatalog`, {type:"WATCHING"});
  
  client.handler.updateColors(client);
  
  const botAvatar = client.users.cache.get(process.env.BOT_ID).avatarURL();
  client.botAvatar = botAvatar;
}