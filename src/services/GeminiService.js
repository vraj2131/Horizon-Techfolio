/**
 * GeminiService - Integration with Google Gemini API for enhanced insights
 * Generates AI-powered explanations and recommendations based on technical analysis
 */

const fetch = require('node-fetch');
const config = require('../../config/config');

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.baseUrl = config.gemini.baseUrl;
    this.model = config.gemini.model;
    this.timeout = config.gemini.timeout;
    this.enabled = config.gemini.enabled && this.apiKey !== null && this.apiKey !== undefined && this.apiKey.trim() !== '';

    if (this.enabled) {
      console.log('🤖 GeminiService initialized and enabled');
      console.log(`   Model: ${this.model}, Base URL: ${this.baseUrl}`);
    } else {
      console.log('⚠️  GeminiService disabled');
      if (!config.gemini.enabled) {
        console.log('   Reason: Explicitly disabled in config');
      } else if (!this.apiKey || this.apiKey.trim() === '') {
        console.log('   Reason: GEMINI_API_KEY not set or empty');
        console.log('   Please set GEMINI_API_KEY in your .env file');
      }
    }
  }

  /**
   * Check if Gemini service is available
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Generate enhanced insights from technical analysis data
   * @param {Object} analysisData - Technical analysis results
   * @returns {Promise<Object>} Enhanced insights object
   */
  async generateInsights(analysisData) {
    if (!this.enabled) {
      return null;
    }

    try {
      const prompt = this.buildPrompt(analysisData);
      const response = await this.callGeminiAPI(prompt);
      
      if (response && response.insights) {
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating Gemini insights:', error.message);
      // Return null on error - don't break the main flow
      return null;
    }
  }

  /**
   * Build prompt for Gemini API
   * @param {Object} analysisData - Technical analysis data
   * @returns {string} Formatted prompt
   */
  buildPrompt(analysisData) {
    const {
      ticker,
      currentPrice,
      horizon,
      riskTolerance,
      strategyName,
      strategyDescription,
      finalRecommendation,
      confidence,
      indicators,
      recommendationText,
      reason
    } = analysisData;

    // Format indicator data for context (this is for the old detailed format, not used in concise prompt)
    // Keeping for backward compatibility but using safe extraction
    const indicatorDetails = Object.entries(indicators).map(([type, data]) => {
      if (data.error) {
        return `${type}: Error - ${data.error}`;
      }
      
      let valueStr = '';
      try {
        if (typeof data.value === 'number') {
          valueStr = data.value.toFixed(2);
        } else if (data.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          // Handle complex indicators like MACD or Bollinger Bands
          if (data.value.macd !== undefined) {
            const macdVal = Array.isArray(data.value.macd) && data.value.macd.length > 0 ? data.value.macd[data.value.macd.length - 1] : (typeof data.value.macd === 'number' ? data.value.macd : null);
            const signalVal = Array.isArray(data.value.signal) && data.value.signal.length > 0 ? data.value.signal[data.value.signal.length - 1] : (typeof data.value.signal === 'number' ? data.value.signal : null);
            valueStr = `MACD: ${macdVal !== null && typeof macdVal === 'number' ? macdVal.toFixed(2) : 'N/A'}, Signal: ${signalVal !== null && typeof signalVal === 'number' ? signalVal.toFixed(2) : 'N/A'}`;
          } else if (data.value.upper !== undefined || data.value.middle !== undefined || data.value.lower !== undefined) {
            const getLastValue = (arrOrVal) => {
              if (arrOrVal === undefined || arrOrVal === null) return null;
              if (Array.isArray(arrOrVal) && arrOrVal.length > 0) return arrOrVal[arrOrVal.length - 1];
              return typeof arrOrVal === 'number' ? arrOrVal : null;
            };
            const upperVal = getLastValue(data.value.upper);
            const middleVal = getLastValue(data.value.middle);
            const lowerVal = getLastValue(data.value.lower);
            valueStr = `Upper: ${upperVal !== null && typeof upperVal === 'number' ? upperVal.toFixed(2) : 'N/A'}, Middle: ${middleVal !== null && typeof middleVal === 'number' ? middleVal.toFixed(2) : 'N/A'}, Lower: ${lowerVal !== null && typeof lowerVal === 'number' ? lowerVal.toFixed(2) : 'N/A'}`;
          } else {
            valueStr = JSON.stringify(data.value);
          }
        } else {
          valueStr = String(data.value || 'N/A');
        }
      } catch (err) {
        valueStr = 'Format error';
      }

      return `${type}: ${valueStr}, Signal: ${data.signal?.toUpperCase() || 'HOLD'}`;
    }).join('\n');

    // Filter out indicators with errors and create summary
    const validIndicators = Object.entries(indicators).filter(([_, data]) => !data.error && data.value !== undefined);
    
    // Debug: Log the structure of indicators
    console.log(`🔍 Debug: Processing ${validIndicators.length} valid indicators`);
    validIndicators.forEach(([type, data]) => {
      console.log(`🔍 ${type} value type:`, typeof data.value, Array.isArray(data.value) ? '(array)' : '', 
        data.value && typeof data.value === 'object' ? `keys: ${Object.keys(data.value).join(', ')}` : '');
    });
    
    const indicatorSummary = validIndicators.length > 0 
      ? validIndicators.map(([type, data]) => {
          let valueStr = '';
          try {
            // Handle simple number values
            if (typeof data.value === 'number') {
              valueStr = data.value.toFixed(2);
            } 
            // Handle object values (MACD, Bollinger Bands, etc.)
            else if (data.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
              // Handle MACD indicator
              if (data.value.macd !== undefined) {
                const macdVal = Array.isArray(data.value.macd) && data.value.macd.length > 0
                  ? data.value.macd[data.value.macd.length - 1] 
                  : (typeof data.value.macd === 'number' ? data.value.macd : null);
                const signalVal = Array.isArray(data.value.signal) && data.value.signal.length > 0
                  ? data.value.signal[data.value.signal.length - 1]
                  : (typeof data.value.signal === 'number' ? data.value.signal : null);
                valueStr = `MACD:${macdVal !== null && typeof macdVal === 'number' ? macdVal.toFixed(2) : 'N/A'}, Signal:${signalVal !== null && typeof signalVal === 'number' ? signalVal.toFixed(2) : 'N/A'}`;
              } 
              // Handle Bollinger Bands indicator
              else if (data.value.upper !== undefined || data.value.middle !== undefined || data.value.lower !== undefined) {
                // Safely extract the last value from arrays
                const getLastValue = (arrOrVal) => {
                  if (arrOrVal === undefined || arrOrVal === null) return null;
                  if (Array.isArray(arrOrVal)) {
                    return arrOrVal.length > 0 ? arrOrVal[arrOrVal.length - 1] : null;
                  }
                  return typeof arrOrVal === 'number' ? arrOrVal : null;
                };
                
                const upperVal = getLastValue(data.value.upper);
                const middleVal = getLastValue(data.value.middle);
                const lowerVal = getLastValue(data.value.lower);
                
                // Format only if we have valid numbers
                const upperStr = (upperVal !== null && typeof upperVal === 'number' && !isNaN(upperVal)) ? upperVal.toFixed(2) : 'N/A';
                const middleStr = (middleVal !== null && typeof middleVal === 'number' && !isNaN(middleVal)) ? middleVal.toFixed(2) : 'N/A';
                const lowerStr = (lowerVal !== null && typeof lowerVal === 'number' && !isNaN(lowerVal)) ? lowerVal.toFixed(2) : 'N/A';
                
                valueStr = `Upper:${upperStr}, Middle:${middleStr}, Lower:${lowerStr}`;
              } else {
                valueStr = 'Complex value';
              }
            } 
            // Handle array values (shouldn't happen for indicators, but handle it)
            else if (Array.isArray(data.value)) {
              const lastVal = data.value.length > 0 ? data.value[data.value.length - 1] : null;
              valueStr = lastVal !== null && typeof lastVal === 'number' ? lastVal.toFixed(2) : 'Array value';
            } 
            else {
              valueStr = String(data.value || 'N/A');
            }
          } catch (formatError) {
            console.error(`❌ Error formatting ${type} indicator value:`, formatError.message);
            console.error(`   Value structure:`, JSON.stringify(data.value, null, 2).substring(0, 200));
            valueStr = 'Value format error';
          }
          return `${type}:${valueStr} (${data.signal || 'hold'})`;
        }).join(', ')
      : 'No indicators available (using price and recommendation only)';

    // Strategy-specific context
    let strategyContext = '';
    if (strategyName === 'Trend Following') {
      strategyContext = 'Uses moving averages (SMA) to identify trends. Price above SMA suggests uptrend.';
    } else if (strategyName === 'Mean Reversion') {
      strategyContext = 'Uses RSI and Bollinger Bands to identify overbought/oversold conditions for reversals.';
    } else if (strategyName === 'Momentum') {
      strategyContext = 'Uses MACD, EMA, and RSI to capture price momentum and trend strength.';
    } else if (strategyName === 'Conservative') {
      strategyContext = 'Uses multiple indicators (SMA, RSI, Bollinger Bands) for consensus-based decisions.';
    }

    // Horizon-specific guidance
    let horizonContext = '';
    if (horizon === 1) {
      horizonContext = 'Short-term (1yr): Focus on momentum and quick trend changes.';
    } else if (horizon === 2) {
      horizonContext = 'Medium-term (2yr): Balance between trends and mean reversion opportunities.';
    } else if (horizon >= 5) {
      horizonContext = 'Long-term (5yr+): Focus on sustained trends and fundamental alignment.';
    }

    const prompt = `Analyze ${ticker} stock recommendation for ${horizon}-year investment horizon using ${strategyName} strategy.

**Stock Data:**
Price: $${currentPrice.toFixed(2)}, Strategy: ${strategyName}
Recommendation: ${finalRecommendation.toUpperCase()} (${(confidence * 100).toFixed(0)}% confidence)
${strategyContext}
${horizonContext}

**Technical Indicators (${strategyName} strategy uses these):**
${indicatorSummary || 'No indicators available'}

**Reasoning:** ${reason.substring(0, 200)}${reason.length > 200 ? '...' : ''}

**Provide concise JSON (2-3 sentences per field, strategy-specific):**
{
  "enhancedExplanation": "Why ${finalRecommendation.toUpperCase()} fits ${strategyName} for ${horizon}yr horizon. Reference specific indicator values.",
  "riskAssessment": "Risks specific to ${strategyName} strategy and ${horizon}yr timeframe.",
  "actionableInsights": "Action items for ${horizon}yr investment using ${strategyName} approach.",
  "educationalContext": "How ${strategyName} indicators support this ${horizon}yr recommendation."
}

Be concise. Focus on ${strategyName} strategy and ${horizon}-year horizon.`;

    return prompt;
  }

  /**
   * Call Gemini API
   * @param {string} prompt - The prompt to send
   * @returns {Promise<Object>} Parsed response
   */
  async callGeminiAPI(prompt) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    console.log(`🔗 Calling Gemini API: ${this.baseUrl}/models/${this.model}:generateContent`);
    console.log(`   Prompt length: ${prompt.length} characters`);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500, // Sufficient for concise responses
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ]
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📡 Gemini API response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Gemini API error response:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`❌ Failed to parse response as JSON:`, jsonError.message);
        const textResponse = await response.text();
        console.error(`❌ Raw response:`, textResponse.substring(0, 500));
        throw new Error('Failed to parse Gemini API response as JSON');
      }
      
      console.log(`📦 Gemini API response received`);
      console.log(`📦 Full response keys:`, Object.keys(data || {}));
      console.log(`📦 Candidates: ${data?.candidates?.length || 0}`);
      
      // Check usage metadata
      if (data.usageMetadata) {
        console.log(`📊 Usage: promptTokens=${data.usageMetadata.promptTokenCount}, completionTokens=${data.usageMetadata.candidatesTokenCount}, totalTokens=${data.usageMetadata.totalTokenCount}`);
      }
      
      if (!data || !data.candidates) {
        console.error(`❌ No candidates in response:`, JSON.stringify(data, null, 2));
        throw new Error('Invalid response format from Gemini API - no candidates array');
      }
      
      if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
        console.error(`❌ Invalid candidates array:`, JSON.stringify(data, null, 2));
        throw new Error('Invalid response format from Gemini API - empty candidates array');
      }

      const candidate = data.candidates[0];
      console.log(`📦 Candidate keys:`, Object.keys(candidate || {}));
      console.log(`📦 Candidate structure (first 800 chars):`, JSON.stringify(candidate, null, 2).substring(0, 800));
      
      if (!candidate) {
        console.error(`❌ Candidate is null or undefined`);
        throw new Error('Invalid response format from Gemini API - candidate is null');
      }
      
      // Handle different response structures
      let text = null;
      
      // Check finish reason
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn(`⚠️  Response was truncated due to MAX_TOKENS limit`);
      }
      
      // Check if content has parts - if not, the response might be empty or malformed
      if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        console.error(`❌ Content has no parts array or parts is empty`);
        console.error(`❌ Full content object:`, JSON.stringify(candidate.content, null, 2));
        console.error(`❌ Full candidate:`, JSON.stringify(candidate, null, 2));
        throw new Error('Gemini API returned empty response - content.parts is missing or empty');
      }
      
      try {
        // Log full content structure for debugging (but limit size)
        const contentStr = JSON.stringify(candidate.content, null, 2);
        console.log(`📦 Content structure (${contentStr.length} chars):`, contentStr.substring(0, 1000));
        
        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
          // Standard structure: content.parts[0].text
          if (candidate.content.parts[0] && candidate.content.parts[0].text) {
            text = candidate.content.parts[0].text;
            console.log(`✅ Found text in candidate.content.parts[0].text (${text.length} chars)`);
          } else {
            console.warn(`⚠️  candidate.content.parts[0] exists but has no text field`);
            console.warn(`⚠️  parts[0] structure:`, JSON.stringify(candidate.content.parts[0], null, 2));
          }
        } else {
          console.warn(`⚠️  No parts array found in content`);
          if (candidate.content) {
            console.warn(`⚠️  Content keys:`, Object.keys(candidate.content));
          }
        }
        
        if (!text && candidate.text) {
          // Alternative structure: direct text field
          text = candidate.text;
          console.log(`✅ Found text in candidate.text`);
        }
        
        if (!text && candidate.content && candidate.content.text) {
          // Alternative structure: content.text
          text = candidate.content.text;
          console.log(`✅ Found text in candidate.content.text`);
        }
        
        // If still no text but we have a finishReason, the response might be empty
        if (!text) {
          if (candidate.finishReason === 'MAX_TOKENS') {
            console.error(`❌ Response hit token limit and no text was returned`);
            throw new Error('Gemini API response was truncated and contains no text. Try reducing prompt size or increasing maxOutputTokens.');
          }
          console.error(`❌ Cannot find text in any expected location`);
          console.error(`❌ Candidate structure:`, JSON.stringify(candidate, null, 2));
          throw new Error('Invalid response format from Gemini API - cannot find text');
        }
      } catch (textError) {
        console.error(`❌ Error extracting text:`, textError.message);
        console.error(`❌ Full candidate:`, JSON.stringify(candidate, null, 2));
        throw textError;
      }

      if (!text) {
        console.error(`❌ Text is null or empty:`, JSON.stringify(candidate, null, 2));
        throw new Error('Invalid response format from Gemini API - text is empty');
      }
      console.log(`📝 Gemini response text length: ${text.length} characters`);
      console.log(`📝 First 500 chars: ${text.substring(0, 500)}...`);
      
      // Try to parse as JSON, fallback to plain text
      let parsedResponse;
      try {
        // First, try to extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedResponse = JSON.parse(jsonMatch[1]);
          console.log(`✅ Parsed JSON from markdown code block`);
        } else {
          // Try to parse the entire text as JSON
          // Sometimes Gemini returns JSON directly without markdown
          const trimmedText = text.trim();
          if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
            parsedResponse = JSON.parse(trimmedText);
            console.log(`✅ Parsed JSON directly from text`);
          } else {
            // Try to find JSON object in the text
            const jsonObjectMatch = trimmedText.match(/\{[\s\S]*\}/);
            if (jsonObjectMatch) {
              parsedResponse = JSON.parse(jsonObjectMatch[0]);
              console.log(`✅ Extracted and parsed JSON object from text`);
            } else {
              throw new Error('No JSON object found in response');
            }
          }
        }
        
        // Validate that we have the expected fields
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error('Parsed response is not an object');
        }
        
        // Ensure we have at least one of the expected fields
        const expectedFields = ['enhancedExplanation', 'riskAssessment', 'actionableInsights', 'educationalContext'];
        const hasExpectedField = expectedFields.some(field => parsedResponse[field]);
        
        if (!hasExpectedField) {
          console.warn(`⚠️  Parsed JSON doesn't have expected fields, using fallback`);
          // If the structure is different, try to map it
          parsedResponse = {
            enhancedExplanation: parsedResponse.enhancedExplanation || parsedResponse.explanation || parsedResponse.summary || text,
            riskAssessment: parsedResponse.riskAssessment || parsedResponse.risks || '',
            actionableInsights: parsedResponse.actionableInsights || parsedResponse.insights || parsedResponse.recommendations || '',
            educationalContext: parsedResponse.educationalContext || parsedResponse.context || ''
          };
        }
        
      } catch (parseError) {
        console.warn(`⚠️  Could not parse as JSON:`, parseError.message);
        console.warn(`⚠️  Raw text:`, text.substring(0, 300));
        // If not JSON, wrap in a structured format
        parsedResponse = {
          enhancedExplanation: text,
          riskAssessment: '',
          actionableInsights: '',
          educationalContext: ''
        };
      }

      console.log(`✅ Successfully parsed Gemini response with fields:`, Object.keys(parsedResponse).join(', '));
      console.log(`✅ Field lengths:`, {
        enhancedExplanation: parsedResponse.enhancedExplanation?.length || 0,
        riskAssessment: parsedResponse.riskAssessment?.length || 0,
        actionableInsights: parsedResponse.actionableInsights?.length || 0,
        educationalContext: parsedResponse.educationalContext?.length || 0
      });

      return {
        insights: parsedResponse,
        rawResponse: text
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timeout');
      }
      throw error;
    }
  }
}

module.exports = GeminiService;

