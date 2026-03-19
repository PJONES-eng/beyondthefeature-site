exports.handler = async function () {
  const PLAYLIST_ID = 'PLOE0KN6HCHgZEQBMi8HvrLX-X2VqQQndI';
  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;

  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) throw new Error(`YouTube RSS returned ${response.status}`);
    const xml = await response.text();

    // Parse out up to 3 entries using simple regex (no DOM parser needed in Node)
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null && entries.length < 3) {
      const block = match[1];
      const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'New Episode';
      const link  = (block.match(/<link rel="alternate"[^>]*href="([^"]+)"/) || [])[1] || '#';
      const published = (block.match(/<published>([\s\S]*?)<\/published>/) || [])[1] || '';
      const desc  = (block.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || '';
      entries.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
        link,
        published,
        desc: desc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 120)
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // cache for 1 hour
      },
      body: JSON.stringify({ episodes: entries })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
