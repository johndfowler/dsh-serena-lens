# dsh-serena-lens

A Serena lens for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI — watch what your agents are *thinking* at the code level without leaving the conversation.

A 🧠 button floats at the bottom-right of the GUI. Tap it to open a panel embedding the **Serena web dashboard** — live tool-call stream, executions queue, per-tool usage stats — with **tabs for each machine** (m4 / m5) so you can watch both brains' code exploration side by side.

## Why

DSH shows you the agent's conversation-level thinking (tool calls in the message flow). Serena's dashboard shows the *code-level* thinking underneath: which symbols it searches, which files it opens, which edits it makes, how long each execution takes. The lens puts the second view one click from the first.

## How it works

- Fixed-position overlay (button + panel) — **no DOM mutation inside React's tree** (the file-mentions crash class avoided)
- Iframes the Serena dashboard over the tailnet (`https://<machine>.ts.net:24282`) — reachable from phone and desktop alike
- Both machine frames stay alive across tab switches (state preserved)
- Desktop: right side panel · Narrow/mobile: bottom sheet

## Prerequisite

Serena's dashboard must be reachable from the viewing device. The house setup:

```yaml
# ~/.serena/serena_config.yml
web_dashboard_trusted_hosts:
- 127.0.0.1
- localhost
- <machine>.tail9464ee.ts.net
- <machine>.tail9464ee.ts.net:24282
```

plus `tailscale serve --bg --https 24282 http://127.0.0.1:24282`.

Edit `MACHINES` in `lib/client.js` for your own machine names.

## Install

```bash
cd ~/.dsh/profiles/web
pnpm add file:~/path/to/dsh-serena-lens
```

Add `dsh-serena-lens` to the profile's `dsh.profile.bundles` in `package.json`, restart the GUI, and the 🧠 appears.

## License

MIT
