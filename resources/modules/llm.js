const ollama = require('ollama').default || require('ollama');

askAI = async (prompt) => {
  const response = await ollama.chat({
    model: 'gemma3:4b',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return response.message.content.trim();
}

generateMashupTitle = async (tracks) => {
  return await askAI(`Suggest a title for a mashup of the following tracks: ${tracks.join(', ')}. Try to use words from the track names. Try to avoid adding any random words (other than conjunctions), but if it creates an interesting sounding name, that's fine. Respond with just the title, no explanation.`);
}

generateGenreName = async (genres) => {
  if (genres.some(g => g !== genres[0]))
    return await askAI(`Suggest a name for a genre that combines the following genres: ${genres.join(', ')}. Try to use words from the genre names. Respond with just the name, no explanation.`);
  return genres[0];
}

module.exports = {
  askAI,
  generateMashupTitle,
  generateGenreName
}