# Vendor figures

These are the images embedded in the archived browser-print PDFs under `sources/official/`,
extracted with `pdfimages -png` (lossless; the pixel data is what the browser placed into the PDF
when the page was printed). They were not re-downloaded from the vendor sites: those image hosts are
not reachable from the build environment. No resizing, recolouring or cropping was applied. The only
change is to `aws-bedrock-managed-agents.png`, whose transparency mask is stored as a separate
object in the PDF (`smask`) and is re-attached here as the alpha channel.

| File | Archived page | PDF image | Original image URL (from the captured HTML) |
|---|---|---|---|
| openai-agents-api-hosted.png | openai/agents-api/overview | page 2, #1 | https://developers.openai.com/images/api/agents-api/overview-1.webp |
| openai-agents-api-no-environment.png | openai/agents-api/architecture | page 2, #1 | https://developers.openai.com/images/api/agents-api/architectures-1.webp |
| openai-agents-api-self-hosted.png | openai/agents-api/architecture | page 2, #2 | https://developers.openai.com/images/api/agents-api/architectures-2.webp |
| openai-application-managed-sandbox.png | openai/agents-api/sandbox-lifecycle | page 1, #0 | https://developers.openai.com/images/api/agents-api/application-managed-sandboxes.webp |
| openai-webhook-managed-sandbox.png | openai/agents-api/sandbox-lifecycle | page 2, #2 | https://developers.openai.com/images/api/agents-api/webhook-managed-sandboxes.webp |
| openai-credential-proxy.png | openai/agents-api/sandbox-security | page 2, #1 | https://developers.openai.com/images/api/agents-api/sandbox-security-1.webp |
| google-managed-agents.png | google/managed-agents/overview | page 2, #0 | https://docs.cloud.google.com/static/gemini-enterprise-agent-platform/images/managed-agents-in-gemini-api-architecture.png |
| google-agent-platform.png | google/agent-gateway/overview | page 1, #0 | https://docs.cloud.google.com/static/gemini-enterprise-agent-platform/images/geap-architecture.png |
| google-agent-gateway-modes.png | google/agent-gateway/overview | page 4, #1 | https://docs.cloud.google.com/static/gemini-enterprise-agent-platform/images/agent-gateway-modes.png |
| aws-bedrock-managed-agents.png | aws/bedrock-managed-agents/overview | page 2, #5 + smask #6 | not recorded (no HTML captured) |
| aws-agentcore-sessions.png | aws/agentcore-runtime/deep-research-blog | page 1, #0 | not recorded (no HTML captured) |
| microsoft-hosted-agents-network.png | microsoft/foundry-hosted-agents/networking | page 2, #1 | not recorded (no HTML captured) |

Not available in the archive: the figures in Anthropic's "building with Claude Managed Agents"
article were lazy-loaded and printed as blank placeholders. The live page references them at
`https://assets.claude.com/<hash>.png`; the survey draws its own diagram from the article's text
and labels it as such.
