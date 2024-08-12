
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;
let model: any;

export async function POST(req: Request) {
  console.log('API route handler started');
  try {
    const { image, followUpQuestion, mealContext } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    if (!genAI) {
      console.log('Initializing Gemini API');
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
    }

    let result;
    if (image) {
      const prompt = "Act as a nutritionist and Identify this meal, provide summarized nutritional information, and give advice on its health impact. Format the response in clear sections.";
      console.log('Sending image request to Gemini API...');
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: image.split(',')[1],
            mimeType: 'image/jpeg'
          }
        }
      ]);
    } else if (followUpQuestion && mealContext) {
      console.log('Sending follow-up question to Gemini API...');
      const contextualPrompt = `Given the following meal information: "${mealContext}", please answer this follow-up question: "${followUpQuestion}"`;
      result = await model.generateContent(contextualPrompt);
    } else {
      throw new Error('Invalid request: Provide either an image or a follow-up question with meal context');
    }

    console.log('Received response from Gemini API');
    const response = await result.response;
    return NextResponse.json({ result: response.text() });
  } catch (error) {
    console.error('Detailed error in API route:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}