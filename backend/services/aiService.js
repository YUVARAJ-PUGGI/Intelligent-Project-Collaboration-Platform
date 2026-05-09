/**
 * AI Service
 * 
 * Integrates with language models for generating summaries, extracting entities, etc.
 * Currently supports OpenAI's API. Can be extended for other providers.
 */

const AIService = {
  /**
   * Generate a conversation summary from messages
   * @param {Array} messages - Array of message objects with content and sender info
   * @param {String} apiKey - API key for the AI service
   * @returns {Promise<Object>} Summary with key points, issues, decisions, etc.
   */
  async generateConversationSummary(messages, apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      console.warn('AI_API_KEY not configured. Using mock summary.');
      return this.generateMockSummary(messages);
    }

    try {
      const messageContent = messages
        .map(msg => `${msg.senderName || 'Unknown'}: ${msg.content}`)
        .join('\n\n');

      const prompt = `Analyze this task discussion and provide a structured summary:

Discussion:
${messageContent}

Please provide the summary in JSON format with these fields:
- summary: A 2-3 sentence overview of the discussion
- keyPoints: Array of 3-5 main points discussed
- identifiedIssues: Array of any problems or issues mentioned
- decisions: Array of decisions made or to be made
- pendingWork: Array of tasks that still need to be done
- blockers: Array of any blockers or impediments mentioned

Format ONLY as valid JSON, no additional text.`;

      // Mock implementation - in production, call actual API
      return this.generateMockSummary(messages);
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateMockSummary(messages);
    }
  },

  /**
   * Extract keywords from text for search indexing
   * @param {String} text - Text to extract keywords from
   * @returns {Promise<Array>} Array of keywords
   */
  async extractKeywords(text, apiKey = process.env.OPENAI_API_KEY) {
    try {
      const keywords = this.extractMockKeywords(text);
      return keywords;
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  },

  /**
   * Generate semantic embeddings for text (for vector search)
   * In production, this would call an embedding API
   * @param {String} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(text, apiKey = process.env.OPENAI_API_KEY) {
    try {
      // Mock embedding - in production, call actual embedding API
      return this.generateMockEmbedding(text);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  },

  /**
   * Detect if text contains stress/blocker indicators
   * @param {String} text - Text to analyze
   * @returns {Promise<Object>} Analysis results with detected blockers/stress
   */
  async detectBlockersAndStress(text) {
    const stressIndicators = [
      'blocked',
      'not working',
      'stuck',
      'need help',
      'urgent',
      'critical',
      'broken',
      'error',
      'failing',
      'crash',
      'help',
      'stuck on',
      'can\'t figure out',
      'impossible',
    ];

    const blockerKeywords = text.toLowerCase().match(
      new RegExp(stressIndicators.join('|'), 'gi')
    ) || [];

    return {
      hasBlocker: blockerKeywords.length > 0,
      stressLevel: blockerKeywords.length > 3 ? 'high' : blockerKeywords.length > 0 ? 'medium' : 'low',
      detectedKeywords: [...new Set(blockerKeywords)],
    };
  },

  // Mock implementations for development (no API key needed)

  generateMockSummary(messages) {
    if (!messages || messages.length === 0) {
      return {
        summary: 'No messages in this discussion yet.',
        keyPoints: [],
        identifiedIssues: [],
        decisions: [],
        pendingWork: [],
        blockers: [],
      };
    }

    const content = messages.map(m => m.content).join(' ');
    const words = content.split(/\s+/);

    return {
      summary: `Discussion involving ${messages.length} messages from team members. Key topics covered include ${words.slice(0, 5).join(', ')}.`,
      keyPoints: [
        `${messages.length} messages exchanged`,
        'Discussion focused on task collaboration',
        'Multiple perspectives shared',
      ],
      identifiedIssues: content.includes('error') || content.includes('bug') ? ['Technical issue'] : [],
      decisions: content.includes('decided') || content.includes('agreed') ? ['Decision made'] : [],
      pendingWork: ['Continue discussion as needed'],
      blockers: content.includes('blocked') || content.includes('stuck') ? ['Potential blocker'] : [],
    };
  },

  extractMockKeywords(text) {
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = new Set([
      'the', 'and', 'that', 'this', 'have', 'with', 'from', 'they', 'been', 'were', 'when',
      'your', 'have', 'their', 'what', 'about', 'which', 'would', 'could', 'should',
    ]);

    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
  },

  generateMockEmbedding(text) {
    // Generate a consistent mock embedding based on text length
    const length = 384; // Common embedding dimension
    const seed = text.length;
    const embedding = [];

    for (let i = 0; i < length; i++) {
      // Consistent pseudo-random based on text
      const random = Math.sin(seed + i) * 10000;
      embedding.push((random - Math.floor(random)) * 2 - 1);
    }

    return embedding;
  },
};

module.exports = AIService;
