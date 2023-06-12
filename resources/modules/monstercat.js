module.exports = {
    /*
    * Formats a release ID to be used in a URL
    * @param {string} id - The release ID to be formatted
    * @returns {string} - The formatted release ID
    */
    releaseID(id) {
        // Releases with new UPC-based catalog numbers fail to fetch by default
        // This is due to the MCatalog sheet only listing the last 6 digits of the UPC code.
        // Monstercat's company prefix, 742779, should be prepended before building the URL and fetching the resource.
        if (!id.includes('MC') && !id.includes('742779')) {
            id = '742779' + id;
        }

        return id;
    },

    /*
    * Returns the release URL for a given catalog ID
    * @param {string} id - The release ID
    * @returns {string} - The release URL
    */
    releaseURL: (id) => {
        return `https://monstercat.com/release/${module.exports.releaseID(id)}`;
    },

    /*
    * Returns the cover art URL for a given catalog ID
    * @param {string} id - The release ID
    * @returns {string} - The cover art URL
    */
    coverURL: (id) => {
        return `${module.exports.releaseURL(id)}/cover`;
    },

    /*
    * Returns the API JSON for a given catalog ID
    * @param {string} id - The release ID
    * @returns {object} - The API JSON
    */
    fetchJSON: async (id) => {
        const url = `https://www.monstercat.com/api/catalog/release/${module.exports.releaseID(id)}`;
        const response = await fetch(url);
        return await response.json();
    },

    /*
    * Returns the creator-friendly-ness for a track
    * @param {object} json - The Monstercat API release JSON
    * @param {string} trackName - The track name
    * @returns {bool} - The creator-friendly-ness`
    */
    creatorFriendly: (json, trackName) => {
        const tracks = json.Tracks ?? [];
        const track = tracks.find(t => t.Title == trackName);
        try {
            return track.CreatorFriendly ?? false;
        } catch (e) {
            // maybe log this?
            return false;
        }
    }
}