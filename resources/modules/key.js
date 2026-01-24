const keyCodes = require.main.require('./resources/objects/keyCodes.json');

getKeyID = (key) => {
    try {
        key = key.toLowerCase();
        let keyID = parseInt(keyCodes.find(obj =>
            obj.major.toLowerCase() == key || obj.minor.toLowerCase() == key
        ).keyID);

        return keyID;
    } catch (err) {
        throw err;
    }
},

getMinKey = (keyID) => {
    return keyCodes.find(obj => obj.keyID == keyID).minor;
},

getMajKey = (keyID) => {
    return keyCodes.find(obj => obj.keyID == keyID).major;
}

module.exports = {
    getKeyID,
    getMinKey,
    getMajKey,
}