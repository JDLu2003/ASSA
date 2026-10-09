# 产品原始资料目录

当前优先寻找和核实产品，不进行架构、性能或成本归纳。下表仅索引已经保存的厂商原始资料；平台与内部组件分别标注，不把组件自动视为独立产品。

| 厂商 | 产品或组件 | 官方原文 | 本地 PDF | 提取全文 |
|---|---|---|---|---|
| openai | Agents API | [官方页面](https://developers.openai.com/api/docs/guides/agents-api/overview) | [PDF](../sources/official/openai/agents-api/overview/page.complete.pdf) | [文本](../sources/official/openai/agents-api/overview/page.txt) |
| anthropic | Claude Managed Agents | [官方页面](https://platform.claude.com/docs/en/managed-agents/overview) | [PDF](../sources/official/anthropic/claude-managed-agents/overview/page.pdf) | [文本](../sources/official/anthropic/claude-managed-agents/overview/page.txt) |
| aws | Amazon Bedrock AgentCore | [官方页面](https://aws.amazon.com/bedrock/agentcore/) | [PDF](../sources/official/aws/agentcore/overview/page.pdf) | [文本](../sources/official/aws/agentcore/overview/page.txt) |
| aws | Amazon Bedrock AgentCore Runtime | [官方页面](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html) | [PDF](../sources/official/aws/agentcore-runtime/runtime/page.pdf) | [文本](../sources/official/aws/agentcore-runtime/runtime/page.txt) |
| microsoft | Foundry Agent Service — Hosted agents | [官方页面](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/hosted-agents) | [PDF](../sources/official/microsoft/foundry-hosted-agents/hosted-agents/page.pdf) | [文本](../sources/official/microsoft/foundry-hosted-agents/hosted-agents/page.txt) |
| google | Agent Runtime on Gemini Enterprise Agent Platform | [官方页面](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime/quickstart) | [PDF](../sources/official/google/agent-platform/runtime-quickstart/page.pdf) | [文本](../sources/official/google/agent-platform/runtime-quickstart/page.txt) |
| google | Shell sandbox on Gemini Enterprise Agent Platform | [官方页面](https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/sandbox/shell-sandbox-quickstart) | [PDF](../sources/official/google/agent-platform-sandbox/shell-quickstart/page.pdf) | [文本](../sources/official/google/agent-platform-sandbox/shell-quickstart/page.txt) |
| google | Cloud Run sandboxes | [官方页面](https://cloud.google.com/blog/topics/developers-practitioners/google-cloud-run-sandboxes-are-in-public-preview/) | [PDF](../sources/official/google/cloud-run-sandboxes/announcement/page.pdf) | [文本](../sources/official/google/cloud-run-sandboxes/announcement/page.txt) |
| google | GKE Agent Sandbox | [官方页面](https://cloud.google.com/blog/topics/developers-practitioners/agent-factory-recap-supercharging-agents-on-gke-with-agent-sandbox-and-pod-snapshots) | [PDF](../sources/official/google/gke-agent-sandbox/pod-snapshot-blog/page.pdf) | [文本](../sources/official/google/gke-agent-sandbox/pod-snapshot-blog/page.txt) |
| e2b | E2B Sandboxes | [官方页面](https://docs.e2b.dev/) | [PDF](../sources/official/e2b/sandbox/overview/page.pdf) | [文本](../sources/official/e2b/sandbox/overview/page.txt) |
| daytona | Daytona Sandboxes | [官方页面](https://www.daytona.io/docs/) | [PDF](../sources/official/daytona/sandbox/overview/page.pdf) | [文本](../sources/official/daytona/sandbox/overview/page.txt) |

待核实候选及失败状态见 [products.json](products.json) 和 [product-candidates.json](product-candidates.json)。新一轮产品入口采集均返回代理 HTTP 503，不能据此判断产品不存在。Google 旧链接的重定向已保留，但跳到通用入口不能证明原目标页已采集。

OpenAI 早期打印版 page.pdf 存在裁切，已保留并标记；请使用 page.complete.pdf。网页文本来自工具提取，未添加原创分析。
