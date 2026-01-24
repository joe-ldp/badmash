/*
* Formats a release ID to be used in a URL
* @param {string} id - The release ID to be formatted
* @returns {string} - The formatted release ID
*/
getReleaseID = (id) => {
    // Releases with new UPC-based catalog numbers fail to fetch by default
    // This is due to the MCatalog sheet only listing the last 6 digits of the UPC code.
    // Monstercat's company prefix, 742779, should be prepended before building the URL and fetching the resource.
    if (!id.includes('MC') && !id.includes('742779')) {
        id = '742779' + id;
    }

    return id;
}

/*
* Returns the release URL for a given catalog ID
* @param {string} id - The release ID
* @returns {string} - The release URL
*/
getReleaseURL = (id) => {
    return `https://monstercat.com/release/${getReleaseID(id)}`;
}

/*
* Returns the cover art URL for a given catalog ID
* @param {string} id - The release ID
* @returns {string} - The cover art URL
*/
getCoverURL = (id) => {
    return `${getReleaseURL(id)}/cover`;
}

/*
* Returns the API JSON for a given catalog ID
* @param {string} id - The release ID
* @returns {object} - The API JSON
*/
fetchJSON = async (id) => {
    const url = `https://www.monstercat.com/api/catalog/release/${getReleaseID(id)}`;
    const response = await fetch(url);
    return await response.json();
}

/*
* Returns the creator-friendly-ness for a track
* @param {object} json - The Monstercat API release JSON
* @param {string} trackName - The track name
* @returns {bool} - The creator-friendly-ness`
*/
getCreatorFriendly = (json, trackName) => {
    const tracks = json.Tracks ?? [];
    const track = tracks.find(t => t.Title == trackName);
    try {
        return track.CreatorFriendly ?? false;
    } catch (e) {
        // maybe log this?
        return false;
    }
}

/*
* Returns the ISRC for a track
* @param {object} json - The Monstercat API release JSON
* @param {string} trackName - The track name
* @returns {string} - The ISRC
* @throws {string} - If the track is not found
* @throws {string} - If the track does not have an ISRC
*/
getISRC = (json, trackName) => {
    const tracks = json.Tracks ?? [];
    const track = tracks.find(t => t.Title == trackName);
    if (!track) throw 'track_not_found';
    if (!track.ISRC) throw 'track_no_isrc';
    return track.ISRC;
}

/*
* Returns the brand a track was released on
* @param {object} json - The Monstercat API release JSON
* @param {string} trackName - The track name
* @returns {string} - The brand
* @throws {string} - If the track is not found
* @throws {string} - If the track does not have a brand
*/
getBrand = (json, trackName) => {
    const tracks = json.Tracks ?? [];
    const track = tracks.find(t => t.Title == trackName);
    if (!track) throw 'track_not_found';
    if (!track.Brand) throw 'track_no_brand';
    return track.Brand;
}

/*
* Returns the GRid for a release
* @param {object} json - The Monstercat API release JSON
* @returns {string} - The GRid
* @throws {string} - If the release is not found
* @throws {string} - If the release does not have a GRid
*/
getGRid = (json) => {
    if (!json.Release.GRid) throw 'release_no_grid';
    return json.Release.GRid;
}

/*
* Returns the track number for a track
* @param {object} json - The Monstercat API release JSON
* @param {string} trackName - The track name
* @returns {string} - The track number
* @throws {string} - If the track is not found
* @throws {string} - If the track does not have a track number
*/
getTrackNumber = (json, trackName) => {
    const tracks = json.Tracks ?? [];
    const track = tracks.find(t => t.Title == trackName);
    if (!track) throw 'track_not_found';
    if (!track.TrackNumber) throw 'track_no_track_number';
    return track.TrackNumber;
}

module.exports = {
    getReleaseID,
    getReleaseURL,
    getCoverURL,
    fetchJSON,
    getCreatorFriendly,
    getISRC,
    getBrand,
    getGRid,
    getTrackNumber,
}