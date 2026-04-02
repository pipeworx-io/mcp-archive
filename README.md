# @pipeworx/mcp-archive

MCP server for the [Internet Archive](https://archive.org) — full-text search, item metadata retrieval, and Wayback Machine URL lookups. Free, no auth required.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search archive.org collections (Lucene query syntax) |
| `get_metadata` | Get full metadata for an item by identifier |
| `wayback_check` | Check if a URL has been archived and get the nearest snapshot |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "archive": {
      "type": "url",
      "url": "https://gateway.pipeworx.io/archive"
    }
  }
}
```

## CLI Usage

```bash
npx @anthropic-ai/mcp-client https://gateway.pipeworx.io/archive
```

## License

MIT
