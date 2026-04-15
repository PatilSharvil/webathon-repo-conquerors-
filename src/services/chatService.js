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
  classifyIntent(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('how many') || lower.includes('total') || lower.includes('count')) {
      return { type: 'count', keywords: lower };
    }
    if (lower.includes('risk') || lower.includes('danger') || lower.includes('safe') || lower.includes('trust')) {
      return { type: 'risk_query', keywords: lower };
    }
    if (lower.includes('loan') || lower.includes('debt') || lower.includes('mortgage') || lower.includes('bank')) {
      return { type: 'loan_query', keywords: lower };
    }
    if (lower.includes('dispute') || lower.includes('court') || lower.includes('legal') || lower.includes('conflict')) {
      return { type: 'dispute_query', keywords: lower };
    }
    if (lower.includes('owner') || lower.includes('belong') || lower.includes('property of')) {
      return { type: 'ownership_query', keywords: lower };
    }
    if (lower.includes('location') || lower.includes('where') || lower.includes('in pune') || lower.includes('in nashik') || lower.includes('in nagpur')) {
      return { type: 'location_query', keywords: lower };
    }
    if (lower.includes('compare') || lower.includes('difference') || lower.includes('versus') || lower.includes('vs')) {
      return { type: 'comparison', keywords: lower };
    }
    if (lower.includes('list') || lower.includes('show all') || lower.includes('all properties') || lower === 'properties') {
      return { type: 'list_all', keywords: lower };
    }

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
          propertiesReferenced: propertyCount,
          confidence: 1.0
        };
      }

      // Step 4: Use LLM with retrieved context
      const systemPrompt = `You are LandIntel AI, an intelligent property analysis assistant. 

IMPORTANT RULES:
1. ONLY answer based on the property data provided in the context below.
2. If the question cannot be answered from the data, say "I don't have enough data in the property database to answer that."
3. Be specific - mention survey numbers, owner names, and exact figures.
4. Format your answer with markdown for readability.
5. If asked about risk, mention the number of disputes, active loans, and ownership transfer frequency.
6. Keep answers concise and factual.

CURRENT DATABASE: ${propertyCount} properties loaded.`;

      const userPrompt = `User Question: ${query}\n\nProperty Data:\n${context}`;

      const ollamaResponse = await axios.post(
        `${process.env.OLLAMA_BASE_URL}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'gemma2:2b',
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 500,
            repeat_penalty: 1.2
          }
        },
        { timeout: 30000 }
      );

      const answer = ollamaResponse.data.response.trim();

      return {
        answer,
        source: 'ollama',
        model: process.env.OLLAMA_MODEL || 'gemma2:2b',
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
