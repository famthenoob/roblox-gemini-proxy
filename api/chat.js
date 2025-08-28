export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ error: "Invalid message" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Server error" });
    }

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: message.trim() }],
            }),
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: response.statusText });
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0]?.message?.content) {
            return res.status(500).json({ error: "Invalid DeepSeek response" });
        }

        res.status(200).json({ reply: data.choices[0].message.content.trim() });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}
