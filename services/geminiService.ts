
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getImpactStory(donation: number, causeName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Describe the tangible real-world impact of a ${donation} dollar donation to a charity called "${causeName}". Keep it concise, inspirational, and focused on results. Use one or two short sentences.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text || "Every dollar helps drive change in our communities.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Your contribution directly supports critical initiatives and sustainable growth for this cause.";
  }
}

export async function generateReceiptSummary(artist: string, arena: string, total: number, donation: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a formal but modern receipt summary for a concert ticket. 
      Artist: ${artist}
      Arena: ${arena}
      Total Paid: ${total}
      Tax-Deductible Donation: ${donation}
      Highlight the fact that the donation helps stop scalpers.`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text || "Receipt confirmed.";
  } catch (error) {
    return "Thank you for your purchase and your generous contribution.";
  }
}
