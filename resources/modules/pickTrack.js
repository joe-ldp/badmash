const { getKeyID } = require.main.require('./resources/modules/key.js');

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
}