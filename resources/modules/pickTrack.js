const { getKeyID } = require.main.require('./resources/modules/key.js');

searchTrack = (rows, searchArg) => {
	searchArg = searchArg.toLowerCase().trim();
    let matchCounter = [];
    const dupes = ['remix', 'remixes', 'remake', 'vip', 'classical', 'mix', 'acoustic', '+'];
    const reduceWeight = ['ep', 'album', 'compilation', 'double single'];

    for (const [rowNum, row] of rows.entries()) {
        let weight = 1,
            rowMatches = 0;

        const searchFields = [
                row.ID, row.Date, row.Label, row.Artists, row.Track, row.Comp, row.Length, row.BPM, row.Key
            ].filter(v => v !== undefined).map(v => v.toLowerCase()),
            searchFieldsJoined = searchFields.join(' ');

        if (dupes.some((dupe) => row.Track.includes(dupe) && !searchArg.includes(dupe))) continue;

        // EPs, albums, and compilations have a lower weight
        if (reduceWeight.includes(row.Label.toLowerCase())) weight = 0.5;

        searchArg.split(/ +/g).forEach(arg => {
            if (searchFieldsJoined.includes(arg)) {
                dupes.forEach(dupe => {
                    if (searchFields.includes(dupe) && !searchArg.includes(dupe)) return;
                    rowMatches += weight;
                });
            }
        });

        if (rowMatches) {
            matchCounter.push({
                row: rowNum,
                matches: rowMatches
            });
        }
    }

    if (matchCounter.length) {
        let index = 0;
        for (let i = 0; i < matchCounter.length; i++) {
            if (matchCounter[i].matches > matchCounter[index].matches) index = i;
        }

        return rows[matchCounter[index].row];
    }
    // Sad violin music
    else throw 'no_match';
}

pickTrack = (tracks, rows, desiredGenre = '*', desiredBPM = '*', desiredKey = '*') => {
    let track;
    do {
        track = rows[Math.floor(Math.random() * rows.length)];
        // console.info(`Validating track: ${track.Track} with genre ${track.Label}, key ${track.Key} and BPM ${track.BPM}`);
        // console.info(`Validating genre ${track.Label}: ${validGenre(track.Label, desiredGenre)}`);
        // console.info(`Validating BPM ${track.BPM}: ${validBPM(track.BPM, desiredBPM)}`);
        // console.info(`Validating key ${track.Key}: ${validKey(track.Key, desiredKey)}`);
    } while (
        !validGenre(track.Label, desiredGenre) ||
        !validBPM(track.BPM, desiredBPM) ||
        !validKey(track.Key, desiredKey) ||
        tracks.includes(track)
    );

    // console.log(`Settled on track: ${track.Track} with key ${track.Key} and BPM ${track.BPM}`);
    return track;
}

validGenre = (genre, desiredGenre = '*') => {
    genre = genre.toLowerCase();
    if (['album', 'ep', 'compilation', 'intro', 'miscellaneous', 'orchestral', 'traditional'].includes(genre))
        return false;

    return ((desiredGenre == '*') || (genre == desiredGenre.toLowerCase()));
}

validKey = (key, desiredKey) => {
    try {
        let keyID = getKeyID(key);
        return ((desiredKey == '*') || (Math.abs(keyID - getKeyID(desiredKey)) < 2));
    } catch (err) {
        return false;
    }
}

validBPM = (bpm, desiredBPM) => {
    if (isNaN(bpm))
        return false;

    bpm = parseInt(bpm);
    return (desiredBPM == '*' || Math.abs(100 - (100 * bpm / desiredBPM)) <= 11);
}

module.exports = {
    pickTrack,
    searchTrack,
}