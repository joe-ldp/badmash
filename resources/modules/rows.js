//exports.colorize = (client) =>
//module.exports = (async function(client)
//async function getRows(client)
exports.getRows = async (client) =>
{
    // Redefine the 'doc' (sheet) for easier access, initialize Discord embed
    const doc = this.client.doc;

    // Create a connection between the bot and the Google sheet
    await doc.useServiceAccountAuth(this.client.google);
    await doc.loadInfo();

    // Automatically find the Catalog sheet. Yay!
    var sheetId = 0;
    doc.sheetsByIndex.forEach(x => {
    if (x.title == "Catalog") sheetId = x.sheetId;
    });

    // Get the sheet and an obj array containing its rows
    const sheet = doc.sheetsById[sheetId];
    const rows = await sheet.getRows();

    return rows;
}

//module.exports.getRows = getRows;