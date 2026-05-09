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
  async generateConversationSummary(messages, context = {}, apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      console.warn('AI_API_KEY not configured. Using mock summary.');
      return this.generateMockSummary(messages, context);
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
      return this.generateMockSummary(messages, context);
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateMockSummary(messages, context);
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

  generateMockSummary(messages, context = {}) {
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

    const content = messages.map((m) => m.content).join(' ');
    const cleanWords = content
      .toLowerCase()
      .match(/\b[a-z][a-z0-9_-]{2,}\b/g) || [];

    const stopWords = new Set([
      'the', 'and', 'that', 'this', 'have', 'with', 'from', 'they', 'been', 'were', 'when', 'your',
      'their', 'what', 'about', 'which', 'would', 'could', 'should', 'there', 'here', 'into', 'than',
      'need', 'needto', 'needt', 'need', 'for', 'are', 'was', 'but', 'can', 'cant', 'cannot', 'will',
      'just', 'our', 'you', 'use', 'using', 'get', 'got', 'all', 'any', 'some', 'like', 'more', 'less',
      'team', 'task', 'tasks', 'discussion', 'chat', 'please', 'also', 'make', 'made', 'done', 'doing',
      'work', 'working', 'project', 'right', 'now', 'issue', 'issues', 'bug', 'bugs', 'fix', 'fixed',
      'todo', 'todoist', 'blocker', 'blockers', 'update', 'updates', 'point', 'points', 'summary',
    ]);

    const frequency = new Map();
    cleanWords.forEach((word) => {
      if (stopWords.has(word)) return;
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    const topKeywords = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 6);

    const sentenceSplit = content
      .replace(/\s+/g, ' ')
      .match(/[^.!?]+[.!?]?/g) || [];

    const decisionKeywords = ['decided', 'agreed', 'final', 'choose', 'chosen', 'approved', 'will', 'should'];
    const blockerKeywords = ['blocked', 'stuck', 'cannot', 'can not', 'error', 'failing', 'fails', 'broken', 'issue'];
    const progressKeywords = ['plan', 'design', 'implement', 'building', 'develop', 'test', 'testing', 'fix', 'review', 'deploy', 'complete', 'done'];

    const decisionSentences = sentenceSplit.filter((sentence) =>
      decisionKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))
    ).slice(0, 3).map((sentence) => sentence.trim());

    const blockerSentences = sentenceSplit.filter((sentence) =>
      blockerKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))
    ).slice(0, 3).map((sentence) => sentence.trim());

    const pendingSentences = sentenceSplit.filter((sentence) =>
      /\b(next|need to|still|follow up|pending|remaining|todo|to do|must)\b/i.test(sentence)
    ).slice(0, 4).map((sentence) => sentence.trim());

    const issueSentences = sentenceSplit.filter((sentence) =>
      /\b(error|bug|conflict|delay|missing|slow|confusing|broken|failing)\b/i.test(sentence)
    ).slice(0, 4).map((sentence) => sentence.trim());

    const phase = (() => {
      const text = content.toLowerCase();
      if (/(complete|done|ready to ship|shipped|merged|closed)/.test(text)) return 'completion / handoff';
      if (/(test|testing|debug|fix|bug|error|validate|review)/.test(text)) return 'testing / refinement';
      if (/(implement|build|develop|code|integration|connect)/.test(text)) return 'implementation';
      if (/(plan|design|discuss|clarify|scope|approach)/.test(text)) return 'planning / alignment';
      return 'active discussion';
    })();

    const progressScore = (() => {
      const text = content.toLowerCase();
      let score = 25;
      if (/(implement|build|develop|code|integration|connect)/.test(text)) score += 25;
      if (/(test|testing|debug|fix|review)/.test(text)) score += 20;
      if (/(complete|done|merged|shipped|closed)/.test(text)) score += 25;
      if (/(blocked|stuck|error|failing|broken)/.test(text)) score -= 15;
      return Math.max(10, Math.min(95, score));
    })();

    const contextPieces = [];
    if (context.taskTitle) contextPieces.push(`task "${context.taskTitle}"`);
    if (context.taskStatus) contextPieces.push(`status ${context.taskStatus}`);
    const contextText = contextPieces.length ? ` for the ${contextPieces.join(', ')}` : '';

    return {
      summary: `This task conversation${contextText} includes ${messages.length} message(s) and is currently in ${phase}. The discussion centers on ${topKeywords.length ? topKeywords.join(', ') : 'the active task work'}, with the team appearing to be roughly ${progressScore}% through the task based on the messages shared.`,
      keyPoints: [
        `${messages.length} messages exchanged in the task thread`,
        `Current stage: ${phase}`,
        `Estimated task progress: ${progressScore}%`,
        topKeywords.length ? `Main discussion topics: ${topKeywords.join(', ')}` : 'No strong topic keywords extracted yet',
      ],
      identifiedIssues: issueSentences.length ? issueSentences : (content.match(/\b(error|bug|issue|problem|missing|conflict|delay)\b/gi) || []).slice(0, 3),
      decisions: decisionSentences.length ? decisionSentences : (content.match(/\b(decided|agreed|approved|finalized|will)\b/gi) || []).slice(0, 3),
      pendingWork: pendingSentences.length ? pendingSentences : [
        'Clarify the next implementation or review step',
        'Confirm what remains before the task can be marked complete',
      ],
      blockers: blockerSentences.length ? blockerSentences : (content.match(/\b(blocked|stuck|cannot|failing|broken)\b/gi) || []).slice(0, 3),
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
