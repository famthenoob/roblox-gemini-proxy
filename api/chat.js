export default async function handler(req, res) {
  // Restrict to POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set CORS headers (optional, for broader compatibility)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    // Validate request body
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Invalid or missing 'message' field" });
    }

    // Limit message length to prevent abuse (adjust as needed)
    const MAX_MESSAGE_LENGTH = 200;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    // Validate environment variable
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
        model: "deepseek-chat", // Can be made configurable via env or req.body
        messages: [{ role: "user", content: message.trim() }],
      }),
    });

    // Check DeepSeek API response status
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", errorData);
      return res.status(response.status).json({
        error: `DeepSeek API error: ${errorData.message || response.statusText}`,
      });
    }

    // Parse DeepSeek API response
    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected DeepSeek API response:", data);
      return res.status(500).json({ error: "Invalid response from DeepSeek API" });
    }

    // Return response in the format expected by Roblox
    res.status(200).json({ reply: data.choices[0].message.content.trim() });
  } catch (error) {
    // Log error for debugging
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
