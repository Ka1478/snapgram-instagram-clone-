import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: fetch image from URL and convert to base64
const urlToBase64 = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/jpeg";
  return { base64, contentType };
};

export const generateCaption = async (req, res) => {
  try {
    const { imageUrl, style } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL required" });

    const stylePrompts = {
      casual: "Write a casual, fun Instagram caption with relevant emojis and 5 trending hashtags.",
      professional: "Write a professional, polished caption suitable for a business post with 5 relevant hashtags.",
      funny: "Write a funny, witty caption with humor and 5 trending hashtags.",
      inspirational: "Write an inspirational, motivational caption with 5 relevant hashtags.",
      minimal: "Write a short, minimal caption (under 10 words) with 3 hashtags.",
    };

    const styleInstruction = stylePrompts[style] || stylePrompts.casual;
    const { base64, contentType } = await urlToBase64(imageUrl);

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this image and ${styleInstruction} Make it engaging and authentic. Return only the caption text, nothing else.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${contentType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const caption = response.choices[0]?.message?.content?.trim();
    if (!caption) return res.status(500).json({ success: false, message: "Failed to generate caption" });

    res.json({ success: true, caption });
  } catch (err) {
    console.error("Caption generation error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateCaptionIdeas = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL required" });

    const { base64, contentType } = await urlToBase64(imageUrl);

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this image and generate 3 different caption options:
1) Casual/fun with emojis
2) Inspirational/motivational
3) Witty/funny
Format as a JSON array with keys: style, caption. Include 3-5 hashtags in each.
Return only valid JSON with no markdown or backticks.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${contentType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const ideas = JSON.parse(cleaned);
    res.json({ success: true, ideas });
  } catch (err) {
    console.error("Caption ideas error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};