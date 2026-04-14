/**
 * 本地验证 OpenAI 兼容网关：`npm run model-smoke`
 */
import {
  getOpenAICompatCredentialsFromConfig,
  getOpenAICompatModelIdsFromConfig,
  streamChatCompletion,
} from '../src/models/openai-compatible';

async function main() {
  const cred = getOpenAICompatCredentialsFromConfig();
  if (!cred) {
    console.error('请在 src/config/server.config.ts 中填写 openAICompat');
    process.exit(1);
  }
  const models = getOpenAICompatModelIdsFromConfig();
  const model = models[0];
  if (!model) {
    console.error('请在 src/config/server.config.ts 中配置 openAICompat.modelIds');
    process.exit(1);
  }
  const text = await streamChatCompletion({
    ...cred,
    model,
    systemPrompt: '',
    userQuery: '用一句话介绍你自己。',
    onDelta: (piece) => {
      process.stdout.write(piece);
    },
  });
  process.stdout.write('\n');
  console.error('\n[done]', text.length, 'chars');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
