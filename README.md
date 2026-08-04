# mcp-archive

Archive MCP — wraps the Internet Archive APIs (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search Internet Archive for texts, audio, video, and software by keyword. Returns item titles, identifiers, descriptions, and media types. |
| `get_metadata` | Get full metadata for an archived item by identifier. Returns title, creator, date, format, size, and access details. |
| `wayback_check` | Check if a URL was archived and retrieve the closest snapshot. Returns capture dates and direct link to the archived version. |
| `list_files` | List the downloadable files for an archive.org item by identifier: name, format, size, and a constructed download_url. Use search / get_metadata first to find an identifier. (archive.org items, not Wayback snapshots.) Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "archive": {
      "url": "https://gateway.pipeworx.io/archive/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Archive data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
