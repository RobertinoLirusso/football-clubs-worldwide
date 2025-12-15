import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Initialize Gemini AI with the provided API key
    this.genAI = new GoogleGenerativeAI('');
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });
    
    
    }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Sorry, an error occurred while processing your question. Please try again.';
    }
  }

  async generateClubInfo(clubName: string, cityCountry: string): Promise<string> {
    const prompt = `Provide interesting and brief information about the football club "${clubName}" from ${cityCountry}.
    Include historical data, important achievements and curiosities. Keep the response in English and concise (maximum 200 words).`;

    return this.generateResponse(prompt);
  }
}
