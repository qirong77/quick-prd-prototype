import { anthorpic } from "./anthorpic";

const systemPrompt = ``;
const query = `你是什么模型？模型的型号是多少？`;

async function testMessage() {
    const { baseURL, apiKey } = anthorpic.getKeyAndUrl();
    const text = await anthorpic.streamChatCompletion({
        baseURL,
        apiKey,
        model: anthorpic.models[0],
        systemPrompt,
        userQuery: query,
        onDelta: (piece) => {
            process.stdout.write(piece);
        },
    });
}

testMessage().catch((err) => {
    console.error("error", err);
});
