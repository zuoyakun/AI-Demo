/**
 * AIGenTest - API集成系统
 * 负责与阿里云百炼API和Custom Search JSON API的集成
 */

window.APISystem = {
    // API配置
    config: {
        aliCloud: {
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-turbo',
            maxTokens: 2000,
            temperature: 0.7
        },
        search: {
            baseUrl: 'https://www.googleapis.com/customsearch/v1',
            maxResults: 5
        }
    },

    // API状态
    state: {
        apiKeyValid: false,
        searchApiValid: false,
        rateLimitRemaining: 100,
        lastError: null
    },

    // 初始化API系统
    init() {
        console.log('🔌 初始化API系统...');
        this.validateAPIs();
        console.log('✅ API系统初始化完成');
    },

    // 验证API配置
    async validateAPIs() {
        const config = window.App?.getConfig() || {};
        
        // 验证阿里云API
        if (config.apiKey) {
            try {
                await this.testAliCloudAPI(config.apiKey);
                this.state.apiKeyValid = true;
                console.log('✅ 阿里云API验证成功');
            } catch (error) {
                console.error('❌ 阿里云API验证失败:', error);
                this.state.apiKeyValid = false;
            }
        }

        // 验证搜索API
        if (config.searchApiKey && config.searchEngineId) {
            try {
                await this.testSearchAPI(config.searchApiKey, config.searchEngineId);
                this.state.searchApiValid = true;
                console.log('✅ 搜索API验证成功');
            } catch (error) {
                console.error('❌ 搜索API验证失败:', error);
                this.state.searchApiValid = false;
            }
        }
    },

    // 测试阿里云API
    async testAliCloudAPI(apiKey) {
        const testPayload = {
            model: this.config.aliCloud.model,
            messages: [
                {
                    role: 'user',
                    content: '测试连接'
                }
            ],
            max_tokens: 10
        };

        const response = await this.makeAliCloudRequest(apiKey, testPayload);
        return response;
    },

    // 测试搜索API
    async testSearchAPI(apiKey, searchEngineId) {
        const testQuery = 'test';
        const url = `${this.config.search.baseUrl}?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(testQuery)}&num=1`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`搜索API测试失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    },

    // 调用阿里云百炼API
    async callAliCloudAPI(payload) {
        const config = window.App?.getConfig() || {};
        
        if (!config.apiKey) {
            throw new Error('请先配置阿里云API密钥');
        }

        if (!this.state.apiKeyValid) {
            await this.validateAPIs();
            if (!this.state.apiKeyValid) {
                throw new Error('API密钥验证失败');
            }
        }

        try {
            const response = await this.makeAliCloudRequest(config.apiKey, payload);
            this.updateRateLimit(response);
            return response;
        } catch (error) {
            this.handleAPIError(error);
            throw error;
        }
    },

    // 发送阿里云API请求
    async makeAliCloudRequest(apiKey, payload) {
        const url = `${this.config.aliCloud.baseUrl}/chat/completions`;
        
        const requestBody = {
            model: payload.model || this.config.aliCloud.model,
            messages: payload.messages,
            temperature: payload.temperature || this.config.aliCloud.temperature,
            max_tokens: payload.max_tokens || this.config.aliCloud.maxTokens,
            stream: false
        };

        console.log('📤 发送API请求:', { url, model: requestBody.model });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('📥 收到API响应:', data);

        return data;
    },

    // 搜索相关信息
    async searchInformation(query, options = {}) {
        const config = window.App?.getConfig() || {};
        
        if (!config.searchApiKey || !config.searchEngineId) {
            console.warn('⚠️ 搜索API未配置，跳过搜索');
            return { items: [] };
        }

        try {
            const searchResults = await this.performSearch(query, {
                apiKey: config.searchApiKey,
                searchEngineId: config.searchEngineId,
                ...options
            });

            console.log('🔍 搜索结果:', searchResults);
            return searchResults;
        } catch (error) {
            console.error('❌ 搜索失败:', error);
            return { items: [] };
        }
    },

    // 执行搜索
    async performSearch(query, options) {
        const {
            apiKey,
            searchEngineId,
            language = 'zh-CN',
            num = this.config.search.maxResults,
            safe = 'active'
        } = options;

        const params = new URLSearchParams({
            key: apiKey,
            cx: searchEngineId,
            q: query,
            num: num.toString(),
            hl: language,
            safe
        });

        const url = `${this.config.search.baseUrl}?${params}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`搜索请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        // 处理搜索结果
        return {
            query,
            totalResults: data.searchInformation?.totalResults || '0',
            searchTime: data.searchInformation?.searchTime || '0',
            items: (data.items || []).map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                displayLink: item.displayLink
            }))
        };
    },

    // 智能搜索增强
    async enhancedSearch(topic, context = '') {
        // 生成更好的搜索查询
        const searchQueries = this.generateSearchQueries(topic, context);
        
        const allResults = [];
        
        for (const query of searchQueries) {
            try {
                const results = await this.searchInformation(query);
                allResults.push(...results.items);
                
                // 避免搜索API频率限制
                await this.delay(200);
            } catch (error) {
                console.warn(`搜索查询失败: ${query}`, error);
            }
        }

        // 去重和排序
        const uniqueResults = this.deduplicateResults(allResults);
        return this.rankResults(uniqueResults, topic);
    },

    // 生成搜索查询
    generateSearchQueries(topic, context) {
        const baseQueries = [
            `${topic} 最佳实践`,
            `${topic} 测试方案`,
            `${topic} 测试工具`,
            `how to test ${topic}`,
            `${topic} testing best practices`
        ];

        // 根据上下文添加特定查询
        if (context.includes('自动化')) {
            baseQueries.push(`${topic} 自动化测试`, `${topic} automation testing`);
        }
        
        if (context.includes('性能')) {
            baseQueries.push(`${topic} 性能测试`, `${topic} performance testing`);
        }

        if (context.includes('安全')) {
            baseQueries.push(`${topic} 安全测试`, `${topic} security testing`);
        }

        return baseQueries.slice(0, 3); // 限制查询数量
    },

    // 去重搜索结果
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = result.link;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    },

    // 排序搜索结果
    rankResults(results, topic) {
        return results.sort((a, b) => {
            // 根据标题和摘要中包含的关键词数量排序
            const aScore = this.calculateRelevanceScore(a, topic);
            const bScore = this.calculateRelevanceScore(b, topic);
            return bScore - aScore;
        }).slice(0, this.config.search.maxResults);
    },

    // 计算相关性分数
    calculateRelevanceScore(result, topic) {
        const text = (result.title + ' ' + result.snippet).toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        
        let score = 0;
        topicWords.forEach(word => {
            if (word.length > 2 && text.includes(word)) {
                score += 1;
            }
        });

        // 额外的质量指标
        if (text.includes('best practice') || text.includes('最佳实践')) score += 2;
        if (text.includes('guide') || text.includes('指南')) score += 1;
        if (text.includes('tutorial') || text.includes('教程')) score += 1;
        
        return score;
    },

    // 生成基于搜索的回复
    async generateSearchBasedReply(expert, query, searchResults) {
        if (searchResults.items.length === 0) {
            return this.generateFallbackReply(expert, query);
        }

        // 整理搜索信息
        const searchSummary = searchResults.items.map(item => 
            `标题: ${item.title}\n摘要: ${item.snippet}\n链接: ${item.link}`
        ).join('\n\n');

        // 构建带搜索信息的提示
        const enhancedPrompt = `基于以下搜索到的信息，请以${expert.name}的身份回答用户问题：

用户问题：${query}

搜索信息：
${searchSummary}

请结合搜索信息和你的专业知识，提供准确、实用的建议。如果搜索信息有用，请在回答中引用相关链接。`;

        try {
            const response = await this.callAliCloudAPI({
                messages: [
                    {
                        role: 'system',
                        content: expert.prompt
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('生成搜索增强回复失败:', error);
            return this.generateFallbackReply(expert, query);
        }
    },

    // 生成备用回复
    generateFallbackReply(expert, query) {
        return `作为${expert.name}，我来分析一下这个问题。

基于我在${expert.expertise.join('、')}方面的经验，我建议：

1. 首先需要明确具体的测试目标和范围
2. 分析项目的技术特点和业务需求
3. 选择合适的测试方法和工具
4. 制定详细的测试计划和时间安排

如果您能提供更多具体信息，我可以给出更精确的建议。`;
    },

    // 更新速率限制信息
    updateRateLimit(response) {
        // 从响应头中获取速率限制信息
        if (response.headers) {
            const remaining = response.headers.get('X-RateLimit-Remaining');
            if (remaining) {
                this.state.rateLimitRemaining = parseInt(remaining);
            }
        }
    },

    // 处理API错误
    handleAPIError(error) {
        this.state.lastError = {
            message: error.message,
            timestamp: new Date(),
            type: this.classifyError(error)
        };

        console.error('🚨 API错误:', error);

        // 根据错误类型采取相应措施
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            this.state.apiKeyValid = false;
            if (window.App) {
                window.App.showNotification('API密钥无效，请重新配置', 'error');
            }
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            if (window.App) {
                window.App.showNotification('API调用频率过高，请稍后重试', 'warning');
            }
        }
    },

    // 错误分类
    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('401') || message.includes('unauthorized')) {
            return 'authentication';
        } else if (message.includes('429') || message.includes('rate limit')) {
            return 'rate_limit';
        } else if (message.includes('timeout') || message.includes('network')) {
            return 'network';
        } else {
            return 'unknown';
        }
    },

    // 获取API状态
    getStatus() {
        return {
            aliCloudValid: this.state.apiKeyValid,
            searchValid: this.state.searchApiValid,
            rateLimitRemaining: this.state.rateLimitRemaining,
            lastError: this.state.lastError
        };
    },

    // 重置API状态
    resetStatus() {
        this.state = {
            apiKeyValid: false,
            searchApiValid: false,
            rateLimitRemaining: 100,
            lastError: null
        };
    },

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 检查网络连接
    async checkNetworkConnection() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            return false;
        }
    },

    // 获取API使用统计
    getUsageStats() {
        return {
            totalRequests: parseInt(localStorage.getItem('aigent_total_requests') || '0'),
            todayRequests: parseInt(localStorage.getItem(`aigent_requests_${new Date().toDateString()}`) || '0'),
            lastRequestTime: localStorage.getItem('aigent_last_request_time'),
            averageResponseTime: parseFloat(localStorage.getItem('aigent_avg_response_time') || '0')
        };
    },

    // 更新使用统计
    updateUsageStats(responseTime) {
        const today = new Date().toDateString();
        const totalRequests = parseInt(localStorage.getItem('aigent_total_requests') || '0') + 1;
        const todayRequests = parseInt(localStorage.getItem(`aigent_requests_${today}`) || '0') + 1;
        
        localStorage.setItem('aigent_total_requests', totalRequests.toString());
        localStorage.setItem(`aigent_requests_${today}`, todayRequests.toString());
        localStorage.setItem('aigent_last_request_time', new Date().toISOString());
        
        // 计算平均响应时间
        const avgResponseTime = parseFloat(localStorage.getItem('aigent_avg_response_time') || '0');
        const newAvgResponseTime = (avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
        localStorage.setItem('aigent_avg_response_time', newAvgResponseTime.toString());
    }
};

// 导出到全局
window.APISystem = APISystem;