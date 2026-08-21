import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this image and ${styleInstruction} Make it engaging and authentic. Return only the caption text, nothing else. Do not include any thinking or reasoning.`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 200,
      reasoning_effort: "none",
    });

    let caption = response.choices[0]?.message?.content?.trim();
    if (!caption) return res.status(500).json({ success: false, message: "Failed to generate caption" });

    // Strip <think>...</think> block if present
    caption = caption.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

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

    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
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
Return only valid JSON with no markdown or backticks. Do not include any thinking or reasoning.`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 400,
      reasoning_effort: "none",
    });

    let raw = response.choices[0]?.message?.content?.trim();

    // Strip <think>...</think> block if present
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Clean any markdown code fences
    const cleaned = raw.replace(/```json|```/g, "").trim();

    const ideas = JSON.parse(cleaned);
    res.json({ success: true, ideas });
  } catch (err) {
    console.error("Caption ideas error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};