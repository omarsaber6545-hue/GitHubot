import { CACHE_TTLS, SUPPORTED_DOCS_TECHS } from '../config/constants.js';
import { DocSearchResult } from '../types/docs.js';
import { RestClient } from '../utils/restClient.js';
import { cacheService } from './cacheService.js';

export class DocsService {
  private mdnClient: RestClient;
  private genericClient: RestClient;

  // Curated knowledge index for instant, highly relevant developer results
  private curatedDocs: DocSearchResult[] = [
    // JavaScript
    {
      id: 'js-array-methods',
      technology: 'javascript',
      website: 'developer.mozilla.org',
      title: 'JavaScript Array Methods (MDN)',
      description: 'Reference for standard Array instance methods like map(), filter(), reduce(), slice(), splice(), find().',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
      icon: '🟨',
      category: 'Methods',
    },
    {
      id: 'js-promises',
      technology: 'javascript',
      website: 'developer.mozilla.org',
      title: 'Promise & Async/Await (MDN)',
      description: 'Understanding asynchronous programming, Promises, Promise.all, and async/await in modern JavaScript.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
      icon: '🟨',
      category: 'Asynchronous',
    },
    {
      id: 'js-fetch',
      technology: 'javascript',
      website: 'developer.mozilla.org',
      title: 'Fetch API (MDN)',
      description: 'Modern JavaScript Fetch API interface for making HTTP requests in browsers and Node.js environments.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      icon: '🟨',
      category: 'Web APIs',
    },

    // TypeScript
    {
      id: 'ts-handbook',
      technology: 'typescript',
      website: 'typescriptlang.org',
      title: 'TypeScript Handbook: The Basics',
      description: 'Comprehensive guide covering types, interfaces, generics, utility types, union types, and narrowing.',
      url: 'https://www.typescriptlang.org/docs/handbook/2/basic-types.html',
      icon: '🔷',
      category: 'Basics',
    },
    {
      id: 'ts-utility-types',
      technology: 'typescript',
      website: 'typescriptlang.org',
      title: 'TypeScript Utility Types',
      description: 'Standard built-in utility types: Partial, Required, Readonly, Record, Pick, Omit, Exclude, Extract, Awaited.',
      url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
      icon: '🔷',
      category: 'Types',
    },
    {
      id: 'ts-generics',
      technology: 'typescript',
      website: 'typescriptlang.org',
      title: 'TypeScript Generics',
      description: 'Creating reusable components and type-safe abstractions with Generic functions, classes, and interfaces.',
      url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
      icon: '🔷',
      category: 'Generics',
    },

    // Node.js
    {
      id: 'node-fs',
      technology: 'nodejs',
      website: 'nodejs.org',
      title: 'Node.js File System (fs/promises)',
      description: 'Node.js built-in module for interacting with the file system asynchronously using Promises.',
      url: 'https://nodejs.org/api/fs.html',
      icon: '🟩',
      category: 'Core Modules',
    },
    {
      id: 'node-http',
      technology: 'nodejs',
      website: 'nodejs.org',
      title: 'Node.js HTTP / HTTPS Modules',
      description: 'Core HTTP client and server APIs for handling network requests, headers, and streaming data.',
      url: 'https://nodejs.org/api/http.html',
      icon: '🟩',
      category: 'Networking',
    },
    {
      id: 'node-events',
      technology: 'nodejs',
      website: 'nodejs.org',
      title: 'Node.js EventEmitter',
      description: 'Event-driven architecture and the EventEmitter class in Node.js runtime.',
      url: 'https://nodejs.org/api/events.html',
      icon: '🟩',
      category: 'Events',
    },

    // Python
    {
      id: 'python-standard-library',
      technology: 'python',
      website: 'docs.python.org',
      title: 'Python Standard Library Reference',
      description: 'Official documentation for built-in functions, data types, math, collections, asyncio, and os modules.',
      url: 'https://docs.python.org/3/library/',
      icon: '🐍',
      category: 'Standard Library',
    },
    {
      id: 'python-asyncio',
      technology: 'python',
      website: 'docs.python.org',
      title: 'Python asyncio — Asynchronous I/O',
      description: 'Concurrent programming with coroutines, event loops, tasks, and asynchronous streams in Python.',
      url: 'https://docs.python.org/3/library/asyncio.html',
      icon: '🐍',
      category: 'Concurrency',
    },
    {
      id: 'python-typing',
      technology: 'python',
      website: 'docs.python.org',
      title: 'Python Typing & Type Hints',
      description: 'Support for type hints (PEP 484), Union, Optional, TypedDict, Generic, and Literal types.',
      url: 'https://docs.python.org/3/library/typing.html',
      icon: '🐍',
      category: 'Typing',
    },

    // Discord.js
    {
      id: 'djs-guide-slash-commands',
      technology: 'discordjs',
      website: 'discordjs.guide',
      title: 'Discord.js Guide: Slash Commands',
      description: 'Step-by-step guide to registering, handling, and structuring application slash commands in Discord.js v14.',
      url: 'https://discordjs.guide/creating-your-bot/slash-commands.html',
      icon: '🤖',
      category: 'Commands',
    },
    {
      id: 'djs-embeds',
      technology: 'discordjs',
      website: 'discordjs.guide',
      title: 'Discord.js Guide: Embeds & Messages',
      description: 'Creating rich visual embeds with EmbedBuilder, colors, fields, images, and timestamps.',
      url: 'https://discordjs.guide/popular-topics/embeds.html',
      icon: '🤖',
      category: 'UI Components',
    },
    {
      id: 'djs-components',
      technology: 'discordjs',
      website: 'discordjs.guide',
      title: 'Discord.js Guide: Buttons & Select Menus',
      description: 'Building interactive user interfaces using ActionRowBuilder, ButtonBuilder, and StringSelectMenuBuilder.',
      url: 'https://discordjs.guide/message-components/buttons.html',
      icon: '🤖',
      category: 'Message Components',
    },

    // React
    {
      id: 'react-hooks',
      technology: 'react',
      website: 'react.dev',
      title: 'React Built-in Hooks Reference',
      description: 'Official guide for useState, useEffect, useContext, useMemo, useCallback, useRef, and useId.',
      url: 'https://react.dev/reference/react/hooks',
      icon: '⚛️',
      category: 'Hooks',
    },
    {
      id: 'react-components',
      technology: 'react',
      website: 'react.dev',
      title: 'React Component Architecture & State',
      description: 'Managing component state, passing props, lifting state up, and avoiding unnecessary re-renders.',
      url: 'https://react.dev/learn/describing-the-ui',
      icon: '⚛️',
      category: 'Core',
    },

    // Next.js
    {
      id: 'nextjs-app-router',
      technology: 'nextjs',
      website: 'nextjs.org',
      title: 'Next.js App Router Documentation',
      description: 'Routing, layouts, Server Components, Client Components, loading UI, and error boundaries in Next.js.',
      url: 'https://nextjs.org/docs/app',
      icon: '▲',
      category: 'App Router',
    },
    {
      id: 'nextjs-server-actions',
      technology: 'nextjs',
      website: 'nextjs.org',
      title: 'Next.js Server Actions & Mutations',
      description: 'Executing asynchronous server code directly from forms and client components with Server Actions.',
      url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations',
      icon: '▲',
      category: 'Data Fetching',
    },

    // Express
    {
      id: 'express-routing',
      technology: 'express',
      website: 'expressjs.com',
      title: 'Express.js Routing Guide',
      description: 'Defining route paths, route parameters, response methods, and using express.Router() modular handlers.',
      url: 'https://expressjs.com/en/guide/routing.html',
      icon: '🚂',
      category: 'Routing',
    },
    {
      id: 'express-middleware',
      technology: 'express',
      website: 'expressjs.com',
      title: 'Using Express Middleware',
      description: 'Application-level, router-level, error-handling, built-in (express.json), and third-party middleware.',
      url: 'https://expressjs.com/en/guide/using-middleware.html',
      icon: '🚂',
      category: 'Middleware',
    },

    // Git
    {
      id: 'git-branching',
      technology: 'git',
      website: 'git-scm.com',
      title: 'Git Branching & Rebasing',
      description: 'Mastering git branch, checkout, switch, merge, rebase, merge conflict resolution, and detached HEAD.',
      url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging',
      icon: '🌿',
      category: 'Branching',
    },
    {
      id: 'git-reset-revert',
      technology: 'git',
      website: 'git-scm.com',
      title: 'Git Reset, Revert & Checkout',
      description: 'Understanding how to safely undo commits, unstage files, restore files, and rewrite commit history.',
      url: 'https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified',
      icon: '🌿',
      category: 'History Manipulation',
    },

    // Docker
    {
      id: 'dockerfile-reference',
      technology: 'docker',
      website: 'docs.docker.com',
      title: 'Dockerfile Reference Guide',
      description: 'Complete instruction list for FROM, RUN, CMD, ENTRYPOINT, COPY, ADD, ENV, EXPOSE, and multi-stage builds.',
      url: 'https://docs.docker.com/reference/dockerfile/',
      icon: '🐳',
      category: 'Dockerfile',
    },
    {
      id: 'docker-compose',
      technology: 'docker',
      website: 'docs.docker.com',
      title: 'Docker Compose Specification',
      description: 'Defining and running multi-container Docker applications with compose.yaml, networks, and volumes.',
      url: 'https://docs.docker.com/compose/',
      icon: '🐳',
      category: 'Compose',
    },

    // Rust
    {
      id: 'rust-book',
      technology: 'rust',
      website: 'doc.rust-lang.org',
      title: 'The Rust Programming Language',
      description: 'The definitive book covering ownership, borrowing, lifetimes, pattern matching, traits, and smart pointers.',
      url: 'https://doc.rust-lang.org/book/',
      icon: '🦀',
      category: 'Language Book',
    },

    // Go
    {
      id: 'go-standard-library',
      technology: 'go',
      website: 'pkg.go.dev',
      title: 'Go Standard Library & Packages',
      description: 'Reference documentation for fmt, net/http, sync, context, encoding/json, and goroutine patterns.',
      url: 'https://pkg.go.dev/std',
      icon: '🐹',
      category: 'Standard Library',
    },

    // Tailwind CSS
    {
      id: 'tailwind-docs',
      technology: 'tailwindcss',
      website: 'tailwindcss.com',
      title: 'Tailwind CSS Documentation',
      description: 'Utility-first CSS framework reference for flexbox, grid, spacing, colors, typography, and dark mode.',
      url: 'https://tailwindcss.com/docs',
      icon: '🎨',
      category: 'Styling',
    },

    // Vue
    {
      id: 'vue-composition-api',
      technology: 'vue',
      website: 'vuejs.org',
      title: 'Vue 3 Composition API & Reactivity',
      description: 'Reactivity fundamentals with ref, reactive, computed, watch, lifecycle hooks, and script setup syntax.',
      url: 'https://vuejs.org/guide/extras/composition-api-faq.html',
      icon: '💚',
      category: 'Composition API',
    },
  ];

  constructor() {
    this.mdnClient = new RestClient('https://developer.mozilla.org');
    this.genericClient = new RestClient();
  }

  /**
   * Search developer documentation across technologies
   */
  public async searchDocs(query: string, technology?: string): Promise<DocSearchResult[]> {
    const sanitizedQuery = query.trim().toLowerCase();
    const techKey = technology?.trim().toLowerCase();
    const cacheKey = `docs:search:${sanitizedQuery}:${techKey || 'all'}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        // 1. Search curated high-quality index
        const curatedResults = this.searchCuratedDocs(sanitizedQuery, techKey);

        // 2. Fetch live MDN results if technology is JS, TS, or unspecified
        let mdnResults: DocSearchResult[] = [];
        if (!techKey || techKey === 'javascript' || techKey === 'typescript' || techKey === 'react') {
          mdnResults = await this.searchMdn(sanitizedQuery).catch(() => []);
        }

        // Combine and eliminate duplicates
        const combined = [...curatedResults];
        for (const item of mdnResults) {
          if (!combined.some((c) => c.url === item.url || c.title === item.title)) {
            combined.push(item);
          }
        }

        // If no results found, generate a dynamic high-quality doc search link
        if (combined.length === 0) {
          combined.push(this.generateFallbackDocResult(query, techKey));
        }

        return combined.slice(0, 5);
      },
      CACHE_TTLS.DOCS_SEARCH
    );
  }

  /**
   * Filter and score curated docs by query and technology
   */
  private searchCuratedDocs(query: string, techFilter?: string): DocSearchResult[] {
    const terms = query.split(/\s+/).filter(Boolean);

    let list = this.curatedDocs;
    if (techFilter) {
      list = list.filter(
        (doc) =>
          doc.technology.toLowerCase() === techFilter ||
          doc.website.toLowerCase().includes(techFilter)
      );
    }

    // Score items based on keyword matches in title, description, and technology
    const scored = list.map((doc) => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const descLower = doc.description.toLowerCase();
      const techLower = doc.technology.toLowerCase();

      if (titleLower.includes(query)) score += 10;
      if (techLower.includes(query)) score += 5;
      if (descLower.includes(query)) score += 3;

      for (const term of terms) {
        if (titleLower.includes(term)) score += 3;
        if (descLower.includes(term)) score += 1;
        if (techLower.includes(term)) score += 2;
      }

      return { doc, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.doc);
  }

  /**
   * Search official MDN developer index
   */
  private async searchMdn(query: string): Promise<DocSearchResult[]> {
    interface MdnApiResponse {
      documents?: Array<{
        mdn_url: string;
        title: string;
        summary: string;
      }>;
    }

    try {
      const data = await this.mdnClient.get<MdnApiResponse>(
        `/api/v1/search?q=${encodeURIComponent(query)}&locale=en-US`
      );

      if (!data?.documents) return [];

      return data.documents.slice(0, 3).map((item) => ({
        id: `mdn-${Buffer.from(item.mdn_url).toString('base64').slice(0, 10)}`,
        title: `${item.title} (MDN)`,
        description: item.summary.replace(/<[^>]*>/g, '').trim(),
        url: `https://developer.mozilla.org${item.mdn_url}`,
        website: 'developer.mozilla.org',
        technology: 'javascript',
        icon: '🟨',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate an accurate direct documentation search entry when query isn't in static index
   */
  private generateFallbackDocResult(query: string, techFilter?: string): DocSearchResult {
    const techObj = SUPPORTED_DOCS_TECHS.find((t) => t.id === techFilter);
    const techName = techObj ? techObj.name : 'Developer Documentation';
    const domain = techObj ? techObj.domain : 'devdocs.io';
    const icon = techObj ? techObj.icon : '📚';

    let directUrl = `https://devdocs.io/#q=${encodeURIComponent(query)}`;
    if (techFilter === 'python') {
      directUrl = `https://docs.python.org/3/search.html?q=${encodeURIComponent(query)}`;
    } else if (techFilter === 'discordjs') {
      directUrl = `https://discordjs.guide/#search?q=${encodeURIComponent(query)}`;
    } else if (techFilter === 'docker') {
      directUrl = `https://docs.docker.com/search/?q=${encodeURIComponent(query)}`;
    } else if (techFilter === 'react') {
      directUrl = `https://react.dev/reference/react`;
    }

    return {
      id: `fallback-${Date.now()}`,
      title: `${techName}: Search for "${query}"`,
      description: `Official documentation and API reference for "${query}" on ${domain}.`,
      url: directUrl,
      website: domain,
      technology: techFilter || 'general',
      icon,
    };
  }
}

// Export singleton instance
export const docsService = new DocsService();
