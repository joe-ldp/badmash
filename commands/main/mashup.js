const { SlashCommandBuilder, EmbedBuilder, ComponentType } = require('discord.js');
const { Mashup } = require.main.require('./resources/modules/mashup.js');
const { searchTrack } = require.main.require('./resources/modules/pickTrack.js');
const { getRows } = require.main.require('./resources/modules/sheet.js');
const fs = require('fs');
const mashupsJson = './resources/objects/mashups.json';

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('mashup')
        .setDescription('Toolkit for building mashup tracklists.')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('new')
                .setDescription('Create a new mashup.')
                .addStringOption(option =>
                    option.setName('tracks')
                    .setDescription('Comma-separated list of tracks to add. If none specified, 2 suggested tracks will be added.')
                    .setRequired(false)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('list')
                .setDescription('List all your mashups.'),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing mashup.')
                .addStringOption(option =>
                    option.setName('id')
                    .setDescription('The ID of the mashup to edit.')
                    .setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('delete')
                .setDescription('Delete a mashup.')
                .addStringOption(option =>
                    option.setName('id')
                    .setDescription('The ID of the mashup to delete.')
                    .setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('view')
                .setDescription('View an existing mashup.')
                .addStringOption(option =>
                    option.setName('id')
                    .setDescription('The ID of the mashup to view.')
                    .setRequired(true)),
        ),
    async execute(interaction) {
        await interaction.deferReply();
        switch (interaction.options.getSubcommand()) {
            case 'new':
                return mashupNew(interaction, interaction.options.getString('tracks'));
            case 'list':
                return mashupList(interaction);
            case 'edit':
                return mashupEdit(interaction, interaction.options.getString('id'));
            case 'delete':
                return mashupDelete(interaction, interaction.options.getString('id'));
            case 'view':
                return mashupView(interaction, interaction.options.getString('id'));
        }
    },
};

mashupNew = async (interaction, tracks) => {
    if (tracks) {
        tracks = tracks.split(',').map(t => t.trim());
        tracks = tracks.flatMap(t => searchTrack(getRows(), t));
    }
    mash = new Mashup(`${interaction.user.id}-${Date.now()}`, tracks, interaction.user.username, Date.now(), Date.now());
    await interaction.editReply(await mash.getEmbed());

    const suggestedTrackCollector = interaction.channel.createMessageComponentCollector({
        filter: i => i.customId.startsWith('add_suggested_') && i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 60000 * 15,
    });
    suggestedTrackCollector.on('collect', async m => {
        let mash = Mashup.load(m.customId.split('add_suggested_')[1]);
        if (mash && mash.suggestedTrack) {
            mash.addTrack(mash.suggestedTrack);
            await m.update(await mash.getEmbed());
        } else {
            await m.update({ content: 'No suggested track available to add.', components: [] });
        }
    });
    const editCollector = interaction.channel.createMessageComponentCollector({
        filter: i => i.customId.startsWith('edit_mashup_') && i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 60000 * 15,
    });
    editCollector.on('collect', async m => {
        let mash = Mashup.load(m.customId.split('edit_mashup_')[1]);
        if (mash) {
            return await mashupEdit(m);
        }
    });
    const deleteCollector = interaction.channel.createMessageComponentCollector({
        filter: i => i.customId.startsWith('delete_mashup_') && i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 60000 * 15,
    });
    deleteCollector.on('collect', async m => {
        return await mashupDelete(m, m.customId.split('delete_mashup_')[1]);
    });
}

mashupList = (interaction) => {
    data = fs.readFileSync(mashupsJson, 'utf8');
    mashups = JSON.parse(data).filter(m => m.creator === interaction.user.username);
    if (mashups.length === 0) {
        return interaction.editReply('You have no mashups yet. Use /mashup new to create one!');
    } else {
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Mashups`)
            .setDescription(mashups.map(m => `**${m.title}** - Created on ${new Date(m.createdAt).toLocaleDateString()}`).join('\n'));
        return interaction.editReply({ embeds: [embed] });
    }
}

mashupEdit = (interaction, mashupID) => {
    
}

mashupDelete = async (interaction, mashupID) => {
    mashup = Mashup.load(mashupID);
    if (mashup && mashup.creator === interaction.user.username) {
        fs.readFile(mashupsJson, 'utf8', (err, data) => {
            if (err) throw err;
            if (data) {
                const mashups = JSON.parse(data);
                const updatedMashups = mashups.filter(m => m.id !== mashup.id);
                fs.writeFile(mashupsJson, JSON.stringify(updatedMashups, null, 2), (err) => {
                    if (err) throw err;
                    return interaction.reply('Mashup deleted successfully.');
                });
            }
        });
    } else {
        return interaction.reply('Mashup not found or you do not have permission to delete it.');
    }
}

mashupView = async (interaction, mashupID) => {
    mashup = Mashup.load(mashupID);
    if (mashup && mashup.creator === interaction.user.username) {
        return interaction.editReply(await mashup.getEmbed());
    } else {
        return interaction.editReply('Mashup not found or you do not have permission to view it.');
    }
}