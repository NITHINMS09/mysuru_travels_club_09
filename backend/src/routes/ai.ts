import { Router } from 'express';

const router = Router();

// Types for search results
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

// Web Search - fetches results from DuckDuckGo HTML and parses them
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchQuery = `${query} travel`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const html = await response.text();
    const results = parseSearchResults(html);

    res.json({ results, query: searchQuery });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search service temporarily unavailable' });
  }
});

// Parse DuckDuckGo HTML search results
function parseSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Match each result block
  const resultBlocks = html.split('class="result results_links');

  for (let i = 1; i < resultBlocks.length && results.length < 10; i++) {
    const block = resultBlocks[i];

    // Extract title and URL from anchor tag
    const titleMatch = block.match(/class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!titleMatch) continue;

    let url = titleMatch[1];
    const titleHtml = titleMatch[2];

    // Clean URL - DuckDuckGo wraps URLs in a redirect
    const udParam = url.match(/uddg=([^&]*)/);
    if (udParam) {
      url = decodeURIComponent(udParam[1]);
    }

    // Skip ad results
    if (url.includes('duckduckgo.com') || url.includes('ad_domain')) continue;

    // Clean title - remove HTML tags
    const title = titleHtml.replace(/<[^>]*>/g, '').trim();
    if (!title) continue;

    // Extract snippet
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    let snippet = '';
    if (snippetMatch) {
      snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Extract source domain
    let source = '';
    try {
      source = new URL(url).hostname.replace('www.', '');
    } catch {
      source = url.substring(0, 40);
    }

    if (title && url) {
      results.push({ title, url, snippet, source });
    }
  }

  return results;
}

export default router;
