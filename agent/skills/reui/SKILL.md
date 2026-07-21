---
title: Agent Skills
description: The ReUI Agent Skill teaches your coding agent how to use the ReUI registry well - it pairs with the MCP server so your agent builds with ReUI instead of guessing.
---

The ReUI **Agent Skill** is a small set of markdown files that teaches your coding agent how to build with ReUI: how to find the right item, install it, read its real API, and adapt it by reuse. It pairs with the [ReUI MCP server](/mcp) - together they turn "make me a dashboard" into real ReUI blocks wired to your data.

The skill is free and works with every supported agent. Each per-agent guide sets it up for you; this page explains what it does.

## Skill and MCP are a team

They do different jobs, and they are best together:

- **The MCP server is the live data and the hands.** It answers `search`, returns the real component APIs (`get_component`), validates prop usage (`validate_usage`), and hands back the exact shadcn install command - all against the current registry, scored and ranked.
- **The skill is the workflow brain.** It tells the agent _when_ to reach for ReUI, which tool to call next, and how to adapt what it installs (reuse the block, wire real data, keep the design, never invent props).

Without the skill an agent can still call the tools, but it tends to over-customize, hand-roll what ReUI already ships, or invent APIs. The skill keeps it on rails.

## The workflow it teaches

<Steps>

<Step>Find</Step>

Call `search` with the user's intent. It returns ranked matches across components, examples, blocks, and icons, each with an install command, preview, docs link, and the components it uses.

<Step>Install</Step>

Run the returned shadcn command non-interactively. The CLI resolves dependencies and your base style from `components.json`.

<Step>Read the API</Step>

Call `get_component` for each component the item uses and read its inline API (no guessing), then `get_examples` to copy a real, working composition.

<Step>Adapt by reuse</Step>

Swap demo data for real data, fix icon imports, and align to your theme tokens. Keep the block's structure and styling - do not redesign what ReUI already provides. `validate_usage` flags any prop or name the agent invented before it ships.

</Steps>

## Set it up in your agent

The skill reaches every agent the right way - local CLIs and editors like Claude Code, Codex, Cursor, and OpenCode get it written into your project by a one-line installer, and every other agent receives it at runtime through the MCP, with nothing to install. Any MCP client can also pull it on demand with the `get_agent_skill` tool.

Pick your agent to jump to its skill setup:

<AgentSkillGrid />

<Callout title="Free, and better with a license">
  The skill and the MCP are free and only need a ReUI account. A [Pro or
  Ultimate license](/pricing) unlocks premium blocks and animated icons and
  removes the daily request limit, so the workflow above can install and adapt
  the paid parts of the registry too.
</Callout>
