const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { generateMashupTitle, generateGenreName } = require.main.require('./resources/modules/llm.js');
const { pickTrack } = require.main.require('./resources/modules/pickTrack.js');
const fs = require('fs');
const interactionCreate = require('../../events/interactionCreate');
const mashupsJson = './resources/objects/mashups.json';

class Mashup {
    constructor(id, tracks, creator, createdAt, updatedAt) {
        this.id = id;
        this.tracks = [];
        tracks.forEach(t => this.addTrack(t));
        this.creator = creator;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.save();
    }

    static load(id) {
        const data = fs.readFileSync(mashupsJson, 'utf8');
        const mashups = JSON.parse(data);
        const existing = mashups.find(m => m.id === id);
        if (existing) {
            let mashup = new Mashup(existing.id, existing.tracks, existing.creator, existing.createdAt, existing.updatedAt);
            mashup.genre = existing.genre;
            mashup.title = existing.title;
            mashup.suggestedTrack = existing.suggestedTrack;
            return mashup;
        } else {
            return null; // or throw an error idk
        }
    }

    async save() {
        this.updatedAt = Date.now();
        fs.readFile(mashupsJson, 'utf8', (err, data) => {
            if (err) throw err;
            if (data) {
                const mashups = JSON.parse(data);
                const existingIndex = mashups.findIndex(m => m.id === this.id);
            if (existingIndex !== -1) {
                mashups[existingIndex] = this;
            } else {
                mashups.push(this);
            }
            fs.writeFile(mashupsJson, JSON.stringify(mashups, null, 2), (err) => {
                if (err) throw err;
                console.log(`Mashup saved to ${mashupsJson}`);
            });
            } else {
                fs.writeFile(mashupsJson, JSON.stringify([this], null, 2), (err) => {
                    if (err) throw err;
                    console.log(`Mashup saved to new ${mashupsJson}`);
                });
            }
        });
    }

    deSpreadsheetifyRow(row) {
        return {
            Artists: row.Artists,
            B: row.B,
            BPM: row.BPM,
            CC: row.CC,
            Comp: row.Comp,
            Date: row.Date,
            ID: row.ID,
            Key: row.Key,
            Label: row.Label,
            Length: row.Length,
            Track: row.Track,
        };
    }

    addTrack(track) {
        const cleanTrack = this.deSpreadsheetifyRow(track);
        if (this.tracks.some(t => t === cleanTrack)) return;
        this.tracks.push(cleanTrack);
        this.suggestedTrack = this.deSpreadsheetifyRow(this.suggestTrack());
        this.save();
    }

    removeTrack(track) {
        this.tracks = this.tracks.filter(t => t !== track);
        this.save();
    }

    getTracklist() {
        return this.tracks;
    }

    async getEmbed() {
        const embed = new EmbedBuilder()
            .setTitle(`${this.creator} - ${await generateMashupTitle(this.tracks)}`)
            .setFooter({ text: `Last updated on ${new Date(this.updatedAt).toLocaleDateString()}`
        });
        let actionRow = new ActionRowBuilder();

        const averageBPM = Math.round(this.tracks.reduce((tot, track) => tot + parseInt(track.BPM), 0) / this.tracks.length);
        const averageKeyID = Math.floor(this.tracks.reduce((tot, track) => tot + getKeyID(track.Key), 0) / this.tracks.length);
        const averageKey = getMinKey(averageKeyID);

        this.tracks.forEach(track => {
            let pitchDiff = getKeyID(averageKey) - getKeyID(track.Key);
            embed.addFields({ name: `${track.Artists} - ${track.Track}`, value: `Key: ${track.Key} (pitch ${pitchDiff >= 0 ? '+' : ''}${pitchDiff}), BPM: ${track.BPM}` });
        });
        embed.setDescription(`Last edited on ${new Date(this.updatedAt).toLocaleDateString()}\nGenre: ${await generateGenreName(this.tracks.map(t => t.Label))}\nSuggested Key: ${averageKey}\nSuggested BPM: ${averageBPM}`);

        if (this.suggestedTrack) {
            embed.addFields({ name: 'Suggested track', value: `${this.suggestedTrack.Artists} - ${this.suggestedTrack.Track} (${this.suggestedTrack.Key}, ${this.suggestedTrack.BPM}bpm)` });
            let btnAddSuggested = new ButtonBuilder()
                .setCustomId(`add_suggested_${this.id}`)
                .setLabel('✨Add suggested')
                .setStyle(ButtonStyle.Primary);
            actionRow.addComponents(btnAddSuggested);
        }
        let btnEdit = new ButtonBuilder()
            .setCustomId(`edit_mashup_${this.id}`)
            .setLabel('✍️Edit')
            .setStyle(ButtonStyle.Primary);
        let btnDelete = new ButtonBuilder()
            .setCustomId(`delete_mashup_${this.id}`)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger);
        actionRow.addComponents(btnEdit, btnDelete);

        return { embeds: [embed], components: [actionRow] };
    }

    suggestTrack() {
        return pickTrack(this.tracks, getRows());
    }
}

module.exports = {
    Mashup
}