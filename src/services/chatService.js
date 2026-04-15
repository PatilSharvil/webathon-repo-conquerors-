import Groq from 'groq-sdk';
import Property from '../models/Property.js';
import RiskAssessment from '../models/RiskAssessment.js';

let groq;

function getGroqClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

class ChatService {
  // Retrieve relevant property data based on the user's query
  async retrieveContext(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    // 1. Try to find properties matching keywords
    const keywords = lowerQuery.split(' ').filter(w => w.length > 2);
    if (keywords.length > 0) {
      const orConditions = keywords.flatMap(kw => [
        { ownerName: { $regex: kw, $options: 'i' } },
        { location: { $regex: kw, $options: 'i' } },
        { district: { $regex: kw, $options: 'i' } },
        { surveyNumber: { $regex: kw, $options: 'i' } },
        { landType: { $regex: kw, $options: 'i' } }
      ]);
      const properties = await Property.find({ $or: orConditions }).limit(10);
      results.push(...properties);
    }

    // 2. If no keyword match, get all properties
    if (results.length === 0) {
      const allProperties = await Property.find().limit(20);
      results.push(...allProperties);
    }

    // Deduplicate by _id
    const unique = [];
    const seen = new Set();
    for (const p of results) {
      if (!seen.has(p._id.toString())) {
        seen.add(p._id.toString());
        unique.push(p);
      }
    }

    // Build context string
    let context = 'PROPERTY DATABASE:\n\n';
    for (const p of unique) {
      context += `Property: ${p.surveyNumber}\n`;
      context += `  Owner: ${p.ownerName}\n`;
      context += `  Location: ${p.location}, ${p.district}\n`;
      context += `  Area: ${p.area} acres\n`;
      context += `  Type: ${p.landType || 'N/A'}\n`;
      context += `  Ownership History:\n`;
      for (const o of (p.ownershipHistory || [])) {
        context += `    - ${o.ownerName} (${new Date(o.transferDate).getFullYear()}, ${o.transferType})\n`;
      }
      context += `  Loans:\n`;
      for (const l of (p.loans || [])) {
        context += `    - ${l.lender}: ₹${l.amount?.toLocaleString()} (${l.status})\n`;
      }
      context += `  Disputes:\n`;
      for (const d of (p.disputes || [])) {
        context += `    - ${d.type}: ${d.description} (${d.status})\n`;
      }

      // Include risk assessment if exists
      const risk = await RiskAssessment.findOne({ propertyId: p._id }).sort({ createdAt: -1 });
      if (risk) {
        context += `  Risk Score: ${risk.score}/100 (${risk.riskLevel})\n`;
        context += `  Risk Factors: ${risk.factors.map(f => f.description).join(', ')}\n`;
      }
      context += '\n---\n\n';
    }

    if (unique.length === 0) {
      context = 'No properties found in the database.\n';
    }

    return { context, propertyCount: unique.length, properties: unique };
  }

  // Main chat handler with Groq
  async chat(query, sessionId) {
    try {
      // Step 1: Retrieve context from database
      const { context, propertyCount, properties } = await this.retrieveContext(query);

      // Step 2: Build system prompt
      const systemPrompt = `You are LandIntel AI, an intelligent property data analyst.

CRITICAL RULES:
1. Answer ONLY using facts from the PROPERTY DATA provided below. NEVER invent, guess, or hallucinate.
2. If the data doesn't contain the answer, say: "The property database doesn't contain information about that."
3. Always mention specific survey numbers, owner names, locations, and exact figures from the data.
4. Use markdown formatting: **bold** for property names, bullet points for lists.
5. Keep answers concise (2-4 sentences max unless the user asks for details).
6. When comparing properties, use the actual data: number of disputes, active loans, ownership transfers.
7. For risk assessments, count: active disputes, active loans, and recent ownership changes.
8. If asked about trends or patterns, only describe what the data explicitly shows.

PROPERTY DATA:
${context}

USER QUESTION: ${query}

Answer concisely using specific details from the data above. Use markdown formatting.`;

      // Step 3: Call Groq API
      const client = getGroqClient();
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1000,
        stream: false
      });

      const answer = completion.choices[0]?.message?.content?.trim() || 'No response generated.';

      return {
        answer,
        source: 'groq',
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        propertiesReferenced: propertyCount,
        confidence: 0.95
      };
    } catch (error) {
      console.error('Groq chat error:', error.message);
      return {
        answer: `Error processing your request: ${error.message}`,
        source: 'error',
        propertiesReferenced: 0,
        confidence: 0
      };
    }
  }
}

export default new ChatService();
