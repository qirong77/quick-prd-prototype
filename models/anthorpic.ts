function getKeyAndUrl(supplier: "uyilink" | "tokencheap" = "uyilink") {
    if (supplier === "uyilink") {
        return {
            apiKey: "sk-AYXSw3YKzghPShfoWAwFBFtJT7EVrj9xYtgIFGvJqFtvBNgE",
            baseURL: "https://sz.uyilink.com",
        };
    }
    return {
        apiKey: "sk-76746bc7b87ca8c9fc699fd0932b38957da90ed923aa48a3",
        baseURL: "https://tokencheap.ai",
    };
}
const models: string[] = ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929", "claude-sonnet-4-6"];
const systemPrompt = ``;
const query = `你是什么模型？模型的型号是多少？`;
const baseURL = getKeyAndUrl().baseURL;
const apiKey = getKeyAndUrl().apiKey;
fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
        model: models[0],
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
        ],
    }),
})
    .then((res) => res.text())
    .then((data) => {
        console.log("data", data);
    })
    .catch((err) => {
        console.error("error", err);
    });
