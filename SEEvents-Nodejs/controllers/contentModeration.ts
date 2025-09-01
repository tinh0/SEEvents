import { Filter } from "bad-words";
import OpenAI from "openai";

const openai = new OpenAI();
const profanityFilter = new Filter();

export const moderateContent = async (content, isUrl = false) => {
  // Step 1: Check if the content is empty (skip for URLs)
  if (!isUrl && (!content || content.trim() === "")) {
    return { success: false, error: "Content cannot be empty." };
  }

  // Step 2: Check for profanity using the custom filter (skip for URLs)
  if (!isUrl && profanityFilter.isProfane(content)) {
    return { success: false, error: "Your content contains inappropriate language." };
  }

  // Step 3: Use OpenAI Moderation API to check for harmful content
  try {
    let moderationInput;

    if (isUrl) {
      // If the content is a URL, assume it's an image URL
      moderationInput = [
        {
          type: "image_url",
          image_url: {
            url: content,
          },
        },
      ];
    } else {
      // If the content is text, use it as is
      moderationInput = [
        {
          type: "text",
          text: content,
        },
      ];
    }

    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: moderationInput,
    });

    // Check if the content is flagged by the moderation API
    if (moderation.results[0].flagged) {
      return { success: false, error: "Your content violates our community guidelines." };
    }
  } catch (error) {
    console.error("Error with OpenAI Moderation API:", error);

    // Handle rate limit errors
    if (error.status === 429) {
      return { success: false, error: "We are experiencing high demand. Please try again later." };
    }

    // Handle insufficient quota errors
    if (error.code === "insufficient_quota") {
      return { success: false, error: "Service unavailable due to quota limits. Please contact support." };
    }

    // Handle other errors
    return { success: false, error: "Internal server error" };
  }

  // Step 4: If the content is a URL, perform URL-specific checks
  if (isUrl) {
    // Example: Check if the URL contains inappropriate keywords
    const inappropriateKeywords = ["bad-domain.com", "inappropriate-keyword"];
    if (inappropriateKeywords.some(keyword => content.includes(keyword))) {
      return { success: false, error: "The provided URL is not allowed." };
    }
  }

  // If the content passes all checks
  return { success: true };
};