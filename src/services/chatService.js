import axios from 'axios';
import Property from '../models/Property.js';
import RiskAssessment from '../models/RiskAssessment.js';

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

  // Classify the intent of the user's query
  // Uses strict phrase matching so complex/analytical queries fall through to Ollama
  classifyIntent(query) {
    const lower = query.toLowerCase().trim();

    // Only match if the query is clearly a simple, direct question
    // Complex/analytical queries should fall through to 'general' → Ollama

    // Count queries - must be simple counting questions
    if (/^(how many|total|count|number of)/i.test(lower) && lower.split(' ').length < 10) {
      return { type: 'count', keywords: lower };
    }

    // Risk queries - must explicitly ask about risk levels
    if (/(high risk|low risk|medium risk|critical risk|safe property|risk level|risk score)/i.test(lower)) {
      return { type: 'risk_query', keywords: lower };
    }

    // Loan queries - must explicitly ask about loans
    if (/^(show|list|find|which).*(loan|debt|mortgage)/i.test(lower) || /(active loan|has.*loan|with.*loan)/i.test(lower)) {
      return { type: 'loan_query', keywords: lower };
    }

    // Dispute queries - must explicitly ask about disputes
    if (/^(show|list|find|which).*(dispute|court|conflict)/i.test(lower) || /(has.*dispute|with.*dispute|active dispute)/i.test(lower)) {
      return { type: 'dispute_query', keywords: lower };
    }

    // Ownership queries - must be simple ownership questions
    if (/^(who owns|ownership of|property of|belong to)/i.test(lower) && lower.split(' ').length < 12) {
      return { type: 'ownership_query', keywords: lower };
    }

    // Location queries - must explicitly ask about locations
    if (/^(where|location|properties in|in pune|in nashik|in nagpur)/i.test(lower) && lower.split(' ').length < 12) {
      return { type: 'location_query', keywords: lower };
    }

    // List all - must be a simple listing request
    if (/^(show all|list all|all properties|list properties|show properties$)/i.test(lower)) {
      return { type: 'list_all', keywords: lower };
    }

    // Everything else goes to Ollama with full context
    return { type: 'general', keywords: lower };
  }

  // Generate pre-computed answer for common query types
  generateDirectAnswer(intent, properties) {
    if (intent.type === 'count') {
      return `There are **${properties.length} properties** in the database.\n\n` +
        properties.map(p => `- **${p.surveyNumber}**: ${p.ownerName}, ${p.location}`).join('\n');
    }

    if (intent.type === 'list_all') {
      if (properties.length === 0) return 'No properties found in the database.';
      return `Here are all **${properties.length} properties**:\n\n` +
        properties.map((p, i) => 
          `${i + 1}. **${p.surveyNumber}** - ${p.ownerName}, ${p.location} (${p.area} acres, ${p.landType || 'N/A'})`
        ).join('\n');
    }

    if (intent.type === 'risk_query') {
      const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
      let results = [];
      
      if (intent.keywords.includes('high') || intent.keywords.includes('risk') || intent.keywords.includes('danger')) {
        results = properties.filter(p => p.disputes?.length > 0 || p.loans?.filter(l => l.status === 'active').length > 1);
      } else if (intent.keywords.includes('low') || intent.keywords.includes('safe') || intent.keywords.includes('clean')) {
        results = properties.filter(p => !p.disputes?.length && p.loans?.filter(l => l.status === 'active').length === 0);
      }

      if (results.length === 0) {
        // Return all with risk info
        return `Here's the risk overview for all properties:\n\n` +
          properties.map(p => {
            const activeLoans = p.loans?.filter(l => l.status === 'active').length || 0;
            const disputes = p.disputes?.length || 0;
            const risk = disputes > 0 || activeLoans > 1 ? 'High' : activeLoans > 0 ? 'Medium' : 'Low';
            return `- **${p.surveyNumber}** (${p.ownerName}): ${risk} Risk (${activeLoans} active loans, ${disputes} disputes)`;
          }).join('\n');
      }

      return `Found **${results.length} high-risk properties**:\n\n` +
        results.map(p => 
          `- **${p.surveyNumber}**: ${p.ownerName} (${p.disputes?.length || 0} disputes, ${p.loans?.filter(l => l.status === 'active').length || 0} active loans)`
        ).join('\n');
    }

    if (intent.type === 'loan_query') {
      const withLoans = properties.filter(p => p.loans?.filter(l => l.status === 'active').length > 0);
      if (withLoans.length === 0) return 'No properties with active loans found in the database.';
      
      return `Properties with active loans:\n\n` +
        withLoans.map(p => {
          const activeLoans = p.loans.filter(l => l.status === 'active');
          const totalDebt = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
          return `- **${p.surveyNumber}** (${p.ownerName}): ₹${totalDebt.toLocaleString()} total debt across ${activeLoans.length} active loan(s) from ${activeLoans.map(l => l.lender).join(', ')}`;
        }).join('\n');
    }

    if (intent.type === 'dispute_query') {
      const withDisputes = properties.filter(p => p.disputes?.length > 0);
      if (withDisputes.length === 0) return 'No properties with disputes found in the database.';
      
      return `Properties with disputes:\n\n` +
        withDisputes.map(p => 
          `- **${p.surveyNumber}** (${p.ownerName}): ${p.disputes.map(d => d.type + ' - ' + d.description).join(', ')}`
        ).join('\n');
    }

    if (intent.type === 'ownership_query') {
      const ownershipInfo = properties.map(p => 
        `- **${p.surveyNumber}**: Currently owned by **${p.ownerName}**. Previous owners: ${p.ownershipHistory?.map(o => o.ownerName).join(', ') || 'None recorded'}`
      );
      return `Ownership details:\n\n${ownershipInfo.join('\n')}`;
    }

    if (intent.type === 'location_query') {
      const locations = {};
      properties.forEach(p => {
        const loc = p.location || 'Unknown';
        if (!locations[loc]) locations[loc] = [];
        locations[loc].push(p);
      });
      
      return `Properties by location:\n\n` +
        Object.entries(locations).map(([loc, props]) =>
          `- **${loc}**: ${props.length} properties (${props.map(p => p.surveyNumber).join(', ')})`
        ).join('\n');
    }

    return null; // No direct answer, need LLM
  }

  // Main chat handler
  async chat(query, sessionId) {
    try {
      // Step 1: Retrieve context from database
      const { context, propertyCount, properties } = await this.retrieveContext(query);

      // Step 2: Classify intent
      const intent = this.classifyIntent(query);

      // Step 3: Try direct answer first (no LLM needed)
      const directAnswer = this.generateDirectAnswer(intent, properties);
      if (directAnswer) {
        return {
          answer: directAnswer,
          source: 'direct',
          intent: intent.type,
          propertiesReferenced: propertyCount,
          confidence: 1.0
        };
      }

      // Step 4: Use LLM with retrieved context (RAG)
      // Truncate context to avoid overwhelming smaller models
      const truncatedContext = context.length > 4000 ? context.substring(0, 4000) + '\n...(truncated)' : context;

      const prompt = `You are LandIntel AI, a property data analyst. Answer ONLY using facts from the data below.

PROPERTY DATA:
${truncatedContext}

USER QUESTION: ${query}

Answer concisely using specific details from the data. Use markdown formatting.`;

      const ollamaResponse = await axios.post(
        `${process.env.OLLAMA_BASE_URL}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'gemma4:e2b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 300,
            repeat_penalty: 1.2
          }
        },
        { timeout: 60000 }
      );

      const answer = ollamaResponse.data.response.trim();

      return {
        answer,
        source: 'ollama',
        intent: intent.type,
        model: process.env.OLLAMA_MODEL || 'gemma4:e4b',
        propertiesReferenced: propertyCount,
        confidence: 0.85
      };
    } catch (error) {
      console.error('Chat error:', error.message);
      return {
        answer: `I encountered an error processing your request. Please try again.\n\nError: ${error.message}`,
        source: 'error',
        propertiesReferenced: 0,
        confidence: 0
      };
    }
  }
}

export default new ChatService();
