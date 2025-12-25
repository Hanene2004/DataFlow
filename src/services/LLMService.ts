import { GoogleGenerativeAI } from "@google/generative-ai";

export interface LLMResponse {
    text: string;
    suggestions?: string[];
}

class LLMService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    initialize(apiKey: string) {
        if (!apiKey) return;
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generateInsight(prompt: string, context?: any): Promise<string> {
        if (!this.model) {
            // Check if key exists in localStorage as a fallback
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) {
                this.initialize(savedKey);
            } else {
                throw new Error("AI Service not initialized. Please add your Gemini API Key in settings.");
            }
        }

        const fullPrompt = context
            ? `Context: ${JSON.stringify(context)}\n\nQuery: ${prompt}`
            : prompt;

        try {
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error("LLM Insight Error:", error);
            throw new Error(error.message || "Failed to generate AI insight.");
        }
    }

    async chat(message: string, history: any[]): Promise<string> {
        if (!this.model) {
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) this.initialize(savedKey);
            else throw new Error("AI Service not initialized.");
        }

        try {
            const chat = this.model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error("LLM Chat Error:", error);
            throw new Error(error.message || "Failed to send message to AI.");
        }
    }

    get isReady(): boolean {
        return !!this.model || !!localStorage.getItem('gemini_api_key');
    }
}

export const llmService = new LLMService();
