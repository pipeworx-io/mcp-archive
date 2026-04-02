/**
 * Archive MCP — wraps the Internet Archive APIs (free, no auth)
 *
 * Tools:
 * - search: full-text search across archive.org collections
 * - get_metadata: retrieve complete metadata for a specific item by identifier
 * - wayback_check: check whether a URL has been archived and get the nearest snapshot
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE_URL = 'https://archive.org';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description:
      'Search the Internet Archive for texts, audio, video, software, and other items. Supports Lucene query syntax.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "subject:astronomy", "creator:NASA", "moon landing")',
        },
        limit: { type: 'number', description: 'Number of results to return (1-100, default 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_metadata',
    description:
      'Retrieve full metadata for an Internet Archive item by its identifier (the unique ID in the archive.org URL).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'Archive.org item identifier (e.g., "principleofrelat00eins", "ApolloMissionsMoonLandings")',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wayback_check',
    description:
      'Check whether a URL has ever been archived in the Wayback Machine and retrieve the closest available snapshot.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The URL to look up (e.g., "https://example.com/some-page")',
        },
      },
      required: ['url'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search':
      return search(args.query as string, (args.limit as number) ?? 20);
    case 'get_metadata':
      return getMetadata(args.id as string);
    case 'wayback_check':
      return waybackCheck(args.url as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function search(query: string, limit: number) {
  const params = new URLSearchParams({
    q: query,
    output: 'json',
    rows: String(Math.min(100, Math.max(1, limit))),
    fl: 'identifier,title,creator,date,description,mediatype,subject,downloads',
  });

  const res = await fetch(`${BASE_URL}/advancedsearch.php?${params}`);
  if (!res.ok) throw new Error(`Internet Archive error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as {
    response?: {
      numFound?: number;
      docs?: {
        identifier?: string;
        title?: string | string[];
        creator?: string | string[];
        date?: string;
        description?: string | string[];
        mediatype?: string;
        subject?: string | string[];
        downloads?: number;
      }[];
    };
  };

  const docs = data.response?.docs ?? [];

  return {
    total: data.response?.numFound ?? 0,
    results: docs.map((d) => ({
      id: d.identifier ?? null,
      title: Array.isArray(d.title) ? d.title[0] : (d.title ?? null),
      creator: Array.isArray(d.creator) ? d.creator : (d.creator ? [d.creator] : []),
      date: d.date ?? null,
      description: Array.isArray(d.description) ? d.description[0] : (d.description ?? null),
      mediatype: d.mediatype ?? null,
      subjects: Array.isArray(d.subject) ? d.subject : (d.subject ? [d.subject] : []),
      downloads: d.downloads ?? null,
      url: d.identifier ? `https://archive.org/details/${d.identifier}` : null,
    })),
  };
}

async function getMetadata(id: string) {
  const res = await fetch(`${BASE_URL}/metadata/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Internet Archive error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as {
    metadata?: {
      identifier?: string | string[];
      title?: string | string[];
      creator?: string | string[];
      date?: string | string[];
      description?: string | string[];
      mediatype?: string | string[];
      subject?: string | string[];
      language?: string | string[];
      licenseurl?: string | string[];
      addeddate?: string | string[];
      publicdate?: string | string[];
      downloads?: number;
    };
    files?: { name?: string; format?: string; size?: string; md5?: string }[];
    item?: { downloads?: number; files_count?: number; item_size?: number };
  };

  if (!data.metadata) throw new Error(`Item not found: ${id}`);

  const m = data.metadata;
  const first = <T>(v: T | T[] | undefined): T | null =>
    v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;

  return {
    id: first(m.identifier),
    title: first(m.title),
    creator: Array.isArray(m.creator) ? m.creator : (m.creator ? [m.creator] : []),
    date: first(m.date),
    description: first(m.description),
    mediatype: first(m.mediatype),
    subjects: Array.isArray(m.subject) ? m.subject : (m.subject ? [m.subject] : []),
    language: first(m.language),
    license_url: first(m.licenseurl),
    added_date: first(m.addeddate),
    public_date: first(m.publicdate),
    downloads: data.item?.downloads ?? m.downloads ?? null,
    files_count: data.item?.files_count ?? (data.files?.length ?? null),
    item_size_bytes: data.item?.item_size ?? null,
    url: `https://archive.org/details/${id}`,
    files: (data.files ?? []).slice(0, 20).map((f) => ({
      name: f.name ?? null,
      format: f.format ?? null,
      size_bytes: f.size != null ? parseInt(f.size, 10) : null,
      md5: f.md5 ?? null,
    })),
  };
}

async function waybackCheck(url: string) {
  const params = new URLSearchParams({ url });
  const res = await fetch(`${BASE_URL}/wayback/available?${params}`);
  if (!res.ok) throw new Error(`Wayback Machine error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as {
    url?: string;
    archived_snapshots?: {
      closest?: {
        status?: string;
        available?: boolean;
        url?: string;
        timestamp?: string;
      };
    };
  };

  const closest = data.archived_snapshots?.closest;

  return {
    url: data.url ?? url,
    archived: closest?.available ?? false,
    snapshot_url: closest?.url ?? null,
    timestamp: closest?.timestamp ?? null,
    status: closest?.status ?? null,
  };
}

export default { tools, callTool } satisfies McpToolExport;
