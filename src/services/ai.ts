import { Router } from "express";

const router = Router();

export interface GenerateRequestBody {
  prompt?: string;
  topic?: string;
  platform?: string;
  tone?: string;
  length?: string;
  imageUrl?: string;
}

const createMockGeneratedContent = (
  topic: string,
  platform: string,
  tone: string,
  length: string,
) => {
  return `Here's a ${length.toLowerCase()} ${tone.toLowerCase()} ${platform} post about "${topic}":\n\n${topic} is the perfect topic to share because it offers value, insights, and a clear perspective. Make sure your audience understands why this matters and how they can take action. Keep the message concise, engaging, and tailored to ${platform}.`;
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

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedContent: string;

    if (apiKey) {
      // If a real AI service is configured, integrate here.
      // For now, fallback to a mock generator to keep the flow working.
      generatedContent = createMockGeneratedContent(
        effectiveTopic,
        platform,
        tone,
        length,
      );
    } else {
      generatedContent = createMockGeneratedContent(
        effectiveTopic,
        platform,
        tone,
        length,
      );
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
