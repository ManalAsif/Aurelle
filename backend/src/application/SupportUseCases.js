const Groq = require("groq-sdk");

class SupportUseCases {
  constructor(faqRepo, contactRepo) {
    this.faqRepo = faqRepo;
    this.contactRepo = contactRepo;
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async getFAQs() {
    return await this.faqRepo.getAll();
  }

  async submitContactMessage({ userId, name, email, subject, orderNumber, message }) {
    for (const [field, value] of Object.entries({ name, email, subject, message })) {
      if (!value || !String(value).trim()) {
        const err = new Error(`${field} is required`);
        err.status = 400;
        throw err;
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      const err = new Error("Please enter a valid email address");
      err.status = 400;
      throw err;
    }
    return this.contactRepo.create({ user: userId, name, email, subject, orderNumber, message });
  }

  async getChatbotResponse(message) {
    try {
      const faqs = await this.faqRepo.getAll();
      
      // Prepare FAQ context for the LLM
      const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

      const systemPrompt = `
You are the official AI assistant for Aurelle Boutique, a women's clothing e-commerce store in Pakistan.
Your goal is to help customers with their inquiries in a friendly, professional, and helpful manner.

USE THE FOLLOWING FAQ DATA TO ANSWER CUSTOMER QUESTIONS ACCURATELY:
${faqContext}

GENERAL STORE INFO:
- Store Name: Aurelle Boutique
- Currency: PKR (Rs)
- Support Email: support@aurelle.com
- Support Phone: +92 300 1234567 (Mon-Sat, 9am-6pm)

INSTRUCTIONS:
1. If the answer is in the FAQs, use that information.
2. If the answer is NOT in the FAQs, use your general knowledge but stay within the context of a professional e-commerce store.
3. Be concise and helpful.
4. If you don't know the answer, politely ask them to contact our support team at support@aurelle.com.
5. Always mention prices in PKR (Rs).
6. Customers can track, cancel (while pending/processing) and request returns (within 30 days of delivery) from the "My Orders" page.
7. Payment options: Cash on Delivery, Credit/Debit Card, JazzCash and EasyPaisa. Shipping is free on orders of Rs. 5,000 or more, otherwise Rs. 250.
`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again or contact support.";

    } catch (err) {
      console.error("AI Chatbot failed, falling back to basic logic", err);
      return this.getFallbackResponse(message);
    }
  }

  // Fallback to basic logic if API fails
  getFallbackResponse(message) {
    const msg = message.toLowerCase();
    // Word match so "shipping" doesn't trigger the "hi" greeting
    if (/\b(hello|hi|hey|salam)\b/.test(msg)) return "Hello! I'm the Aurelle assistant. How can I help you today?";
    if (msg.includes("shipping") || msg.includes("delivery")) return "We offer standard (3-5 days) and express shipping (1-2 days). Shipping is free on orders of Rs. 5,000 or more.";
    if (msg.includes("return") || msg.includes("refund")) return "You can request a return within 30 days of delivery from the My Orders page.";
    if (msg.includes("cancel")) return "Orders that are still pending or processing can be cancelled from the My Orders page.";
    if (msg.includes("pay")) return "We accept Cash on Delivery, Credit/Debit Cards, JazzCash and EasyPaisa.";
    return "I'm having a bit of trouble thinking right now. Please email us at support@aurelle.com for help!";
  }
}

module.exports = SupportUseCases;
