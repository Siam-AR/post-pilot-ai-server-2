import { Router } from "express";
import { Groq } from "groq-sdk";

const router = Router();

export interface GenerateRequestBody {
  prompt?: string;
  topic?: string;
  platform?: string;
  tone?: string;
  length?: string;
  imageUrl?: string;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (
  topic: string,
  platform: string,
  tone: string,
  length: string,
) => {
  const summary = `Write a ${length.toLowerCase()} social media post for ${platform} about \"${topic}\" using a ${tone.toLowerCase()} tone.`;
  const lengthInstructions =
    {
      Short: "Keep it between 50 and 100 words.",
      Medium: "Write between 150 and 250 words and include 2-3 bullet points.",
      Long: "Write between 300 and 500 words in multiple paragraphs with a strong hook, key takeaways, and a clear call to action.",
    }[length] ?? "Write between 150 and 250 words.";

  return `You are a helpful copywriter specialized in social media content.

Create a clean social media post based on the following details:
- Topic: ${topic}
- Platform: ${platform}
- Tone: ${tone}
- Length: ${length}

${lengthInstructions}

Return only the final post text. Do not include any explanation, analysis, or conversational prefixes like \"Here is your post\" or \"Sure thing\".`;
};

router.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      topic,
      platform = "LinkedIn",
      tone = "Professional",
      length = "Medium",
    } = req.body as GenerateRequestBody;

    const effectiveTopic = (prompt || topic || "").toString().trim();

    if (!effectiveTopic) {
      return res.status(400).json({
        success: false,
        message: "Topic or prompt is required to generate a post.",
        data: null,
      });
    }

    const model = "llama-3.3-70b-versatile";
    const systemPrompt = buildPrompt(effectiveTopic, platform, tone, length);

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Write the full ${length.toLowerCase()} post now. Only return the final post text without any labels or analysis.`,
        },
      ],
      max_tokens: 700,
      temperature: 0.8,
    });

    const generatedContent = completion.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error("AI generation returned empty content.");
    }

    return res.status(200).json({
      success: true,
      message: "Post generated successfully",
      data: { generatedContent },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate post.",
      data: null,
    });
  }
});

export default router;
