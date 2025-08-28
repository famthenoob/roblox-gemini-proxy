export default async function handler(req, res) {
    // Restrict to POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Set CORS headers (optional for Roblox, but good for flexibility)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    try {
        // Validate request body
        const { message } = req.body;
        if (!message || typeof message !== "string" || message.trim() === "") {
            return res.status(400).json({ error: "Invalid or missing 'message' field" });
        }

        // Limit message length
        const MAX_MESSAGE_LENGTH = 200;
        if (message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
            });
        }

        // Validate API key
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.error("DeepSeek API key is missing");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // Make request to DeepSeek API
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

        // Check DeepSeek API response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("DeepSeek API error:", errorData);
            let errorMessage = errorData.message || response.statusText;
            if (response.status === 429) {
                errorMessage = "Rate limit exceeded. Please try again later.";
            } else if (response.status === 401) {
                errorMessage = "Invalid API key. Contact the server admin.";
            }
            return res.status(response.status).json({ error: errorMessage });
        }

        // Parse DeepSeek response
        const data = await response.json();
        if (!data.choices || !data.choices[0]?.message?.content) {
            console.error("Unexpected DeepSeek API response:", data);
            return res.status(500).json({ error: "Invalid response from DeepSeek API" });
        }

        // Return response for Roblox
        res.status(200).json({ reply: data.choices[0].message.content.trim() });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
