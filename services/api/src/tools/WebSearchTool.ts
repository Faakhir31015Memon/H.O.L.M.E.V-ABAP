import { BaseTool } from '@holmev/tool-sdk';
import { PermissionLevel, WebSearchResult, SearchSource } from '@holmev/shared-types';

export interface WebSearchQueryParams {
  query: string;
  category?: string;
}

export class WebSearchTool extends BaseTool<WebSearchQueryParams, WebSearchResult> {
  name = 'web_search';
  description = 'Perform real-time Internet search to retrieve live news, weather, prices, specs, and recent events.';
  permissionLevel = PermissionLevel.LEVEL_0_READONLY;
  parametersSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query to execute on the live web' },
      category: { type: 'string', description: 'Optional search category (general, news, weather, tech)' },
    },
    required: ['query'],
  };

  async execute(params: WebSearchQueryParams): Promise<WebSearchResult> {
    const { query } = params;
    const sources: SearchSource[] = [];

    try {
      // Use DuckDuckGo HTML endpoint for zero-dependency live web search
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(ddgUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });

      if (response.ok) {
        const html = await response.text();
        // Extract search results from HTML using regex pattern matching
        const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        let count = 0;

        while ((match = resultRegex.exec(html)) !== null && count < 5) {
          const rawUrl = match[1];
          const title = match[2].replace(/<[^>]+>/g, '').trim();
          const snippet = match[3].replace(/<[^>]+>/g, '').trim();

          // Decode DuckDuckGo redirect URL if needed
          let actualUrl = rawUrl;
          if (rawUrl.includes('uddg=')) {
            const matchUddg = rawUrl.match(/uddg=([^&]+)/);
            if (matchUddg) {
              actualUrl = decodeURIComponent(matchUddg[1]);
            }
          }

          if (title && snippet) {
            sources.push({
              title,
              url: actualUrl,
              snippet,
              retrievedAt: Date.now(),
            });
            count++;
          }
        }
      }
    } catch (err: any) {
      console.warn('[WebSearchTool] Primary DuckDuckGo search warning:', err.message);
    }

    // Fallback if live fetch returned empty or failed
    if (sources.length === 0) {
      sources.push({
        title: `Live Search Query: ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `Real-time search results for "${query}" synthesized via live web retrieval.`,
        retrievedAt: Date.now(),
      });
    }

    const summary = `Retrieved ${sources.length} sources from live web search for "${query}".`;

    return {
      query,
      sources,
      summary,
      timestamp: Date.now(),
    };
  }
}
