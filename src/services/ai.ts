import { Router } from "express";

const router = Router();

export interface GenerateRequestBody {
  topic?: string;
  platform?: string;
  tone?: string;
  length?: string;
  imageUrl?: string;
}

router.post("/generate", (req, res) => {
  const {
    topic,
    platform = "LinkedIn",
    tone = "Professional",
    length = "Medium",
  } = req.body as GenerateRequestBody;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return res.status(400).json({
      success: false,
      message: "Topic is required to generate a post.",
      data: null,
    });
  }

  const cleanedTopic = topic.trim();
  const formattedPlatform = platform || "LinkedIn";
  const formattedTone = tone || "Professional";
  const formattedLength = length || "Medium";

  const content = `Here's a ${formattedLength.toLowerCase()} ${formattedTone.toLowerCase()} ${formattedPlatform} post about "${cleanedTopic}":\n\n${formattedTopic} is the perfect topic to share because it offers value, insights, and a clear perspective. Make sure your audience understands why this matters and how they can take action. Keep the message concise, engaging, and tailored to ${formattedPlatform}.`;

  return res.status(200).json({
    success: true,
    message: "Post generated successfully",
    data: { content },
  });
});

export default router;
