require('dotenv').config();
const ollama = require('ollama').default || require('ollama');
const useAI = process.env.USE_AI === 'true';

askAI = async (prompt) => {
  //console.log(prompt);
  const response = await ollama.chat({
    model: 'gemma3:4b',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return response.message.content.trim();
}

generateGenreName = async (genres) => {
  if (useAI) {
    return await generateGenreNameAI(genres);
  } else {
    return await generateGenreNameManual(genres);
  }
}

generateMashupTitleAI = async (tracks) => {
  return await askAI(`Suggest a title for a mashup of the following tracks: ${tracks.map(t => t.Track).join(', ')}. Try to use words from the track names; using other forms of words or synonyms is fine. Try to avoid adding any random words (other than conjunctions), but if it creates an interesting sounding name, that's fine. Respond with just the title, no explanation.`);
}

generateGenreNameAI = async (genres) => {
  if (genres.some(g => g !== genres[0]))
    return await askAI(`Suggest a name for a genre that combines the following genres: ${genres.join(', ')}. Try to use words from the genre names. Respond with just the name, no explanation.`);
}

generateMashupTitleManual = (genre, user, key) => {
  genre = genre.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
  user = user.charAt(0).toUpperCase() + user.slice(1);

  return `${user}'s ${genre} mashup in ${key}`;
}

generateGenreNameManual = (genres) => {
  // Randomly sort the array so we can get 2 random, but unique, genres
  genres.sort(function () { return Math.random - 0.5 });
  const first = genres[0];
  const second = genres[1];

  // Pick a random prefix then add halves of the random genres
  const prefixes = require.main.require('./resources/objects/genrePrefixes.json');
  const prefix = Math.random() < 0.5 ? prefixes[Math.floor(Math.random() * prefixes.length)] : '';
  return prefix + first.slice(0, first.length / 2) + second.slice(second.length / 2);
}

module.exports = {
  askAI,
  generateMashupTitleAI,
  generateMashupTitleManual,
  generateGenreName
}