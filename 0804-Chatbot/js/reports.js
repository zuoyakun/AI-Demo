/**
 * AIGenTest - 报告生成系统
 * 负责生成结构化的测试方案报告和文档导出
 */

window.ReportSystem = {
    // 报告模板
    templates: {
        testPlan: {
            title: '测试方案报告',
            sections: [
                'executive_summary',
                'requirements_analysis', 
                'test_strategy',
                'technical_approach',
                'best_practices',
                'recommendations'
            ]
        }
    },

    // 报告状态
    state: {
        currentReport: null,
        isGenerating: false,
        lastGenerated: null,
        needsUpdate: false,
        hasTestContent: false
    },

    // 初始化报告系统
    init() {
        console.log('📊 初始化报告系统...');
        this.bindEvents();
        
        // 清除任何残留的旧导航元素
        this.clearOldNavigationElements();
        
        // 检查是否需要清除旧报告缓存（版本更新后）
        this.checkAndClearOldReports();
        
        // 延迟恢复当前会话报告（确保其他系统初始化完成）
        setTimeout(() => {
            this.restoreCurrentSessionReport();
        }, 100);
        
        console.log('✅报告系统初始化完成');
    },

    // 清除旧的导航元素
    clearOldNavigationElements() {
        try {
            // 清除固定在页面上的旧导航
            const oldNavElements = document.querySelectorAll('.fixed.top-20.right-4, [class*="nav"].fixed');
            oldNavElements.forEach(nav => {
                if (nav.innerHTML && (nav.innerHTML.includes('报告导航') || nav.innerHTML.includes('项目概述'))) {
                    nav.remove();
                    console.log('🧹 已清除残留的导航元素');
                }
            });
        } catch (error) {
            console.warn('⚠️ 清除旧导航元素时出错:', error);
        }
    },

    // 检查并清除旧版本的报告缓存
    checkAndClearOldReports() {
        try {
            const version = localStorage.getItem('aigent_report_version');
            const currentVersion = '2.0'; // 当前版本，删除了风险评估等章节
            
            if (version !== currentVersion) {
                console.log('🧹 检测到报告结构更新，清除旧报告缓存...');
                this.clearAllReportCache();
                localStorage.setItem('aigent_report_version', currentVersion);
                console.log('✅ 旧报告缓存已清除');
            }
        } catch (error) {
            console.warn('⚠️ 检查报告版本时出错:', error);
        }
    },

    // 清除所有报告缓存
    clearAllReportCache() {
        try {
            // 清除所有以aigent_report_开头的存储项
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('aigent_report_')) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
            
            // 重置当前报告状态
            this.state.currentReport = null;
            this.state.lastGenerated = null;
            
            console.log(`🗑️ 已清除 ${keys.length} 个报告缓存项`);
        } catch (error) {
            console.error('❌ 清除报告缓存失败:', error);
        }
    },

    // 绑定事件
    bindEvents() {
        // PDF导出按钮
        const pdfBtn = document.querySelector('[data-action="export-pdf"]');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.exportToPDF());
        }

        // Word导出按钮
        const wordBtn = document.querySelector('[data-action="export-word"]');
        if (wordBtn) {
            wordBtn.addEventListener('click', () => this.exportToWord());
        }

        // 分享按钮
        const shareBtn = document.querySelector('[data-action="share"]');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.generateShareLink());
        }
    },

    // 标记报告需要更新（用于测试相关对话）
    markNeedsUpdate() {
        this.state.needsUpdate = true;
        this.state.hasTestContent = true;
        console.log('📋 标记报告需要更新');
    },

    // 检查是否有测试内容
    hasTestRelatedContent(conversation) {
        if (!conversation || !conversation.messages) return false;
        
        // 检查是否有专家消息（说明是测试讨论）
        const hasExpertMessages = conversation.messages.some(msg => 
            msg.type === 'ai' && msg.expert
        );
        
        // 检查用户消息是否包含测试关键词
        const userMessages = conversation.messages.filter(msg => msg.type === 'user');
        const hasTestKeywords = userMessages.some(msg => {
            const content = msg.content.toLowerCase();
            return /测试|test|qa|质量|验收|方案|计划/.test(content);
        });
        
        return hasExpertMessages || hasTestKeywords;
    },

    // 检查是否应该生成报告
    shouldGenerateReport(conversation) {
        // 如果已有当前报告，直接返回true（用于刷新恢复）
        if (this.state.currentReport) {
            return true;
        }
        
        // 检查对话是否包含测试相关内容
        const hasTestContent = this.hasTestRelatedContent(conversation);
        
        // 如果包含测试内容，自动设置状态标志
        if (hasTestContent) {
            this.state.hasTestContent = true;
        }
        
        return hasTestContent;
    },

    // 生成报告
    async generateReport(conversation) {
        if (!conversation || !conversation.messages) {
            console.warn('⚠️ 无有效对话数据，无法生成报告');
            return null;
        }

        // 检查是否应该生成报告
        if (!this.shouldGenerateReport(conversation)) {
            console.log('📋 当前对话不包含测试相关内容，跳过报告生成');
            this.renderEmptyReport();
            return null;
        }

        this.state.isGenerating = true;
        console.log('📋 开始生成测试方案报告...');

        try {
            // 分析对话内容
            const analysis = this.analyzeConversation(conversation);
            
            // 提取专家建议
            const expertInsights = this.extractExpertInsights(conversation.messages);
            
            // 生成报告结构
            const report = await this.buildReport(analysis, expertInsights);
            
            // 缓存报告
            this.state.currentReport = report;
            this.state.lastGenerated = new Date();
            
            // 渲染报告
            this.renderReport(report);
            
            // 保存报告到本地存储
            this.saveReportToStorage(report, conversation);
            
            console.log('✅ 测试方案报告生成完成');
            return report;

        } catch (error) {
            console.error('❌ 生成报告失败:', error);
            return null;
        } finally {
            this.state.isGenerating = false;
        }
    },

    // 分析对话内容
    analyzeConversation(conversation) {
        const messages = conversation.messages || [];
        const userMessages = messages.filter(msg => msg.type === 'user');
        const aiMessages = messages.filter(msg => msg.type === 'ai');

        return {
            projectTitle: this.extractSmartTitle(conversation, userMessages),
            userRequirements: userMessages.map(msg => msg.content).join('\n'),
            totalMessages: messages.length,
            expertParticipants: [...new Set(aiMessages.map(msg => msg.expert?.name).filter(Boolean))],
            conversationDuration: this.calculateDuration(messages),
            keyTopics: this.extractKeyTopics(messages),
            complexity: this.assessComplexity(userMessages),
            scope: this.identifyScope(userMessages)
        };
    },

    // 智能提取报告标题
    extractSmartTitle(conversation, userMessages) {
        // 优先使用对话标题（如果有且不是通用格式）
        if (conversation.title && !conversation.title.startsWith('新对话') && conversation.title !== '测试项目') {
            return conversation.title;
        }

        // 从用户消息中提取标题
        const allUserText = userMessages.map(msg => msg.content).join(' ');
        
        // 提取标题的正则模式
        const titlePatterns = [
            // 直接提及具体系统/功能的测试
            /(?:帮我|请|给我)?(?:制定|生成|设计|写)?(.+?)(?:的|功能)?(?:测试方案|测试计划|测试报告|测试策略)/i,
            // 对...进行测试
            /对(.+?)(?:进行|做|执行)(?:测试|检测)/i,
            // 测试...系统/功能
            /测试(.+?)(?:系统|功能|模块|接口|页面|应用|APP|网站|平台)/i,
            // ...需要测试
            /(.+?)(?:需要|要|应该)(?:进行)?测试/i,
            // 如何测试...
            /如何测试(.+?)(?:\?|？|$)/i,
        ];

        for (const pattern of titlePatterns) {
            const match = allUserText.match(pattern);
            if (match && match[1]) {
                let extracted = match[1].trim();
                
                // 清理提取的文本
                extracted = this.cleanExtractedTitle(extracted);
                
                if (extracted.length > 0 && extracted.length < 50) {
                    return extracted;
                }
            }
        }

        // 如果没有匹配到，尝试提取关键词
        const keywordTitle = this.extractKeywordTitle(allUserText);
        if (keywordTitle) {
            return keywordTitle;
        }

        // 兜底方案
        return conversation.title || '测试项目';
    },

    // 清理提取的标题
    cleanExtractedTitle(title) {
        // 移除常见的无关词汇
        const cleanPatterns = [
            /^(?:一个|这个|那个|某个)/,
            /(?:请问|帮我|麻烦|可以|能够|怎么|如何)$/,
            /^(?:关于|针对|基于)/,
            /(?:方案|计划|策略|报告)$/
        ];

        let cleaned = title;
        cleanPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });

        return cleaned.trim();
    },

    // 基于关键词提取标题
    extractKeywordTitle(text) {
        // 常见的测试对象关键词
        const keywords = [
            // 应用类型
            '微信', 'QQ', '支付宝', '淘宝', '京东', 'APP', '网站', '系统', '平台',
            // 功能类型  
            '登录', '注册', '支付', '搜索', '购买', '下单', '上传', '下载',
            // 技术类型
            '接口', 'API', '数据库', '服务器', '前端', '后端',
            // 业务类型
            '电商', '社交', '金融', '教育', '医疗', '游戏'
        ];

        const foundKeywords = [];
        const lowerText = text.toLowerCase();

        keywords.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundKeywords.push(keyword);
            }
        });

        if (foundKeywords.length > 0) {
            // 组合关键词生成标题
            if (foundKeywords.length === 1) {
                return `${foundKeywords[0]}测试项目`;
            } else {
                // 尝试找到主要对象和功能的组合
                const objects = foundKeywords.filter(k => ['微信', 'QQ', '支付宝', '淘宝', '京东', 'APP', '网站', '系统', '平台'].includes(k));
                const functions = foundKeywords.filter(k => ['登录', '注册', '支付', '搜索', '购买', '下单', '上传', '下载'].includes(k));
                
                if (objects.length > 0 && functions.length > 0) {
                    return `${objects[0]}${functions[0]}功能`;
                } else if (objects.length > 0) {
                    return objects[0];
                } else if (functions.length > 0) {
                    return `${functions[0]}功能`;
                }
            }
        }

        return null;
    },

    // 提取专家见解
    extractExpertInsights(messages) {
        const expertMessages = messages.filter(msg => msg.type === 'ai' && msg.expert);
        const insights = {};

        expertMessages.forEach(message => {
            const expertId = message.expert.id;
            if (!insights[expertId]) {
                insights[expertId] = {
                    expert: message.expert,
                    contributions: [],
                    keyPoints: []
                };
            }
            
            insights[expertId].contributions.push({
                content: message.content,
                timestamp: message.timestamp,
                thinking: message.thinking
            });

            // 提取关键点
            const keyPoints = this.extractKeyPoints(message.content);
            insights[expertId].keyPoints.push(...keyPoints);
        });

        return insights;
    },

    // 生成智能的报告标题
    generateReportTitle(projectTitle) {
        // 如果项目标题已经包含"测试"相关词汇，直接使用
        if (/测试|检测|验证/.test(projectTitle)) {
            return `${projectTitle}报告`;
        }

        // 检查是否是功能型标题（包含"功能"）
        if (projectTitle.includes('功能')) {
            return `${projectTitle}测试报告`;
        }

        // 检查是否是系统/应用型标题
        const systemKeywords = ['系统', '平台', '网站', 'APP', '应用', '模块', '接口', 'API'];
        const hasSystemKeyword = systemKeywords.some(keyword => projectTitle.includes(keyword));
        
        if (hasSystemKeyword) {
            return `${projectTitle}测试方案报告`;
        }

        // 检查是否是具体产品（微信、QQ等）
        const productKeywords = ['微信', 'QQ', '支付宝', '淘宝', '京东', '百度', '抖音', '快手'];
        const hasProductKeyword = productKeywords.some(keyword => projectTitle.includes(keyword));
        
        if (hasProductKeyword) {
            // 如果是产品+功能的组合，如"微信登录功能"
            if (/登录|注册|支付|搜索|购买/.test(projectTitle)) {
                return `${projectTitle}测试报告`;
            } else {
                return `${projectTitle}测试方案报告`;
            }
        }

        // 默认格式
        return `${projectTitle}测试方案报告`;
    },

    // 构建报告
    async buildReport(analysis, expertInsights) {
        const report = {
            metadata: {
                title: this.generateReportTitle(analysis.projectTitle),
                generatedAt: new Date(),
                version: '1.0',
                participants: analysis.expertParticipants,
                duration: analysis.conversationDuration
            },
            sections: {}
        };

        // 生成核心报告章节（简化版本）
        try {
            report.sections.executive_summary = this.generateExecutiveSummary(analysis, expertInsights);
            report.sections.requirements_analysis = this.generateRequirementsAnalysis(analysis);
            report.sections.test_strategy = this.generateTestStrategy(expertInsights);
            report.sections.technical_approach = this.generateTechnicalApproach(expertInsights);
            report.sections.best_practices = this.generateBestPractices(expertInsights);
            report.sections.recommendations = this.generateRecommendations(expertInsights);
            // 删除：风险评估、成本估算、时间安排、交付物 - 根据用户反馈这些用处不大
        } catch (error) {
            console.error('❌ 生成报告章节时出错:', error);
            throw error; // 重新抛出错误以便外层捕获
        }

        return report;
    },

    // 生成执行摘要
    generateExecutiveSummary(analysis, expertInsights) {
        const summary = {
            title: '项目概述',
            projectInfo: [
                `项目名称：${analysis.projectTitle}`,
                `复杂度评估：${analysis.complexity}`,
                `测试范围：${analysis.scope.join('、')}`,
                `参与专家：${analysis.expertParticipants.join('、')}`,
                `方案特点：基于${analysis.expertParticipants.length}位AI专家的协作建议，形成了全面的测试解决方案。`
            ],
            keyHighlights: [
                '全方位测试覆盖',
                '专家团队协作',
                '风险驱动的测试策略',
                '成本效益优化'
            ]
        };

        return summary;
    },

    // 生成需求分析
    generateRequirementsAnalysis(analysis) {
        return {
            title: '需求分析',
            originalRequirements: analysis.userRequirements,
            keyFunctions: analysis.keyTopics,
            scope: analysis.scope,
            constraints: this.identifyConstraints(analysis.userRequirements),
            acceptance_criteria: this.generateAcceptanceCriteria(analysis)
        };
    },

    // 生成测试策略
    generateTestStrategy(expertInsights) {
        const strategist = expertInsights.test_strategist;
        const riskController = expertInsights.risk_controller;

        return {
            title: '测试策略',
            overall_approach: strategist?.contributions[0]?.content || '基于风险的测试方法',
            test_types: [
                '功能测试',
                '性能测试',
                '安全测试',
                '兼容性测试',
                '用户体验测试'
            ],
            test_levels: [
                '单元测试',
                '集成测试',
                '系统测试',
                '验收测试'
            ],
            risk_mitigation: riskController?.keyPoints || []
        };
    },

    // 生成技术方案
    generateTechnicalApproach(expertInsights) {
        const techAdvisor = expertInsights.tech_advisor;
        const caseResearcher = expertInsights.case_researcher;

        // 提取专家的实际建议内容
        const techContent = techAdvisor?.contributions?.map(c => c.content).join('\n\n') || 
                           techAdvisor?.keyPoints?.join('\n') || 
                           '基于项目需求推荐合适的测试工具和自动化框架。';

        return {
            title: '技术实施方案',
            content: techContent
        };
    },

    // 注意：风险评估、成本估算、时间安排、交付物等章节已删除
    // 这些功能需要具体项目信息支撑，对通用测试方案意义不大

    // 生成最佳实践
    generateBestPractices(expertInsights) {
        const researcher = expertInsights.case_researcher;

        // 提取专家的实际建议内容
        const practicesContent = researcher?.contributions?.map(c => c.content).join('\n\n') || 
                               researcher?.keyPoints?.join('\n') || 
                               this.getDefaultBestPractices();

        return {
            title: '最佳实践建议',
            content: practicesContent
        };
    },

    // 生成建议
    generateRecommendations(expertInsights) {
        // 汇总所有专家的关键建议
        const allRecommendations = [];
        
        Object.values(expertInsights).forEach(expert => {
            if (expert.keyPoints && expert.keyPoints.length > 0) {
                allRecommendations.push(...expert.keyPoints);
            }
        });

        const recommendationsContent = allRecommendations.length > 0 ? 
            allRecommendations.slice(0, 8).join('\n\n') : // 取前8个最重要的建议
            this.getDefaultRecommendations();

        return {
            title: '专家建议',
            content: recommendationsContent
        };
    },

    // 获取默认最佳实践
    getDefaultBestPractices() {
        return `## 测试最佳实践

### 测试策略
- 早期测试介入，尽早发现问题
- 风险驱动测试，重点关注高风险区域
- 持续集成测试，确保代码质量

### 质量保证
- 建立完善的测试用例评审机制
- 实施有效的缺陷跟踪管理
- 定期进行度量分析和改进

### 流程优化
- 采用敏捷测试方法，提高效率
- 推进测试左移，降低成本
- 建立快速反馈循环机制`;
    },

    // 获取默认建议
    getDefaultRecommendations() {
        return `## 下一步行动建议

### 近期行动
- 确认测试环境需求和配置
- 选择合适的测试工具和框架
- 组建专业的测试团队
- 制定详细的测试计划

### 长期策略
- 建立测试自动化体系
- 持续培养团队测试技能
- 完善质量保证流程
- 建立持续改进机制`;
    },

    // 渲染空报告提示
    renderEmptyReport() {
        const container = document.getElementById('reportContent');
        if (!container) {
            console.error('❌ 找不到报告容器元素 #reportContent');
            return;
        }

        // 使用豆包风格的空状态设计
        container.className = 'doubao-report-container flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50';
        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-xl border border-gray-200">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <i class="fas fa-comments text-4xl text-blue-500"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">当前对话不需要生成测试报告</h3>
                    <p class="text-gray-600 mb-8 leading-relaxed">这看起来是一个普通对话，不涉及测试方案制定。</p>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <h4 class="font-semibold text-blue-800 mb-4 flex items-center justify-center">
                            <i class="fas fa-lightbulb mr-2"></i>
                            如需生成测试报告，请尝试以下方式：
                        </h4>
                        <div class="grid gap-3 text-left">
                            <div class="flex items-center space-x-3 bg-white/60 rounded-lg p-3">
                                <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span class="text-blue-700">"为XX系统制定测试方案"</span>
                            </div>
                            <div class="flex items-center space-x-3 bg-white/60 rounded-lg p-3">
                                <div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span class="text-green-700">"需要进行功能测试"</span>
                            </div>
                            <div class="flex items-center space-x-3 bg-white/60 rounded-lg p-3">
                                <div class="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                                <span class="text-purple-700">"生成测试计划"</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 渲染报告
    renderReport(report) {
        const container = document.getElementById('reportContent');
        if (!container) {
            console.error('❌ 找不到报告容器元素 #reportContent');
            return;
        }

        container.innerHTML = '';

        // 创建豆包风格的容器
        this.createDouBaoStyleContainer(container, report);

        // 显示报告面板
        this.showReportPanel();
    },

    // 创建豆包风格的报告容器
    createDouBaoStyleContainer(container, report) {
        // 添加豆包风格的CSS类
        container.className = 'doubao-report-container flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50';

        // 创建主容器
        const mainContainer = document.createElement('div');
        mainContainer.className = 'max-w-4xl mx-auto space-y-8';

        // 渲染导航
        try {
            this.addDouBaoNavigation(mainContainer);
        } catch (error) {
            console.error('❌ 添加导航失败:', error);
        }

        // 渲染报告头部
        try {
            const header = this.createDouBaoHeader(report.metadata);
            mainContainer.appendChild(header);
        } catch (error) {
            console.error('❌ 创建报告头部失败:', error);
        }

        // 渲染各个章节
        try {
            Object.entries(report.sections).forEach(([sectionId, section], index) => {
                const sectionElement = this.createDouBaoSection(sectionId, section, index);
                mainContainer.appendChild(sectionElement);
            });
        } catch (error) {
            console.error('❌ 渲染章节失败:', error);
        }

        container.appendChild(mainContainer);
    },

    // 创建豆包风格的导航
    addDouBaoNavigation(container) {
        // 创建右上角固定导航
        const nav = document.createElement('div');
        nav.className = 'doubao-navigation-corner fixed top-20 right-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl z-50 max-w-xs';
        nav.innerHTML = `
            <div class="p-3">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-list text-white text-xs"></i>
                        </div>
                        <h3 class="font-semibold text-gray-800 text-sm">目录</h3>
                    </div>
                    <button class="nav-toggle-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100" title="折叠/展开导航">
                        <i class="fas fa-chevron-down transition-transform text-xs"></i>
                    </button>
                </div>
                <div class="nav-content">
                        <a href="#section-executive_summary" class="nav-link flex items-center p-2 rounded-lg hover:bg-blue-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-file-alt text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-blue-700">项目概述</span>
                        </a>
                        <a href="#section-requirements_analysis" class="nav-link flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-green-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-clipboard-list text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-green-700">需求分析</span>
                        </a>
                        <a href="#section-test_strategy" class="nav-link flex items-center p-2 rounded-lg hover:bg-purple-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-purple-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-chess text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-purple-700">测试策略</span>
                        </a>
                        <a href="#section-technical_approach" class="nav-link flex items-center p-2 rounded-lg hover:bg-orange-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-orange-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-cogs text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-orange-700">技术方案</span>
                        </a>
                        <a href="#section-best_practices" class="nav-link flex items-center p-2 rounded-lg hover:bg-yellow-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-yellow-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-star text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-yellow-700">最佳实践</span>
                        </a>
                        <a href="#section-recommendations" class="nav-link flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-sm group">
                            <div class="w-4 h-4 bg-red-500 rounded-sm mr-2 flex items-center justify-center">
                                <i class="fas fa-lightbulb text-white text-xs"></i>
                            </div>
                            <span class="text-gray-700 group-hover:text-red-700">专家建议</span>
                        </a>
                    </div>
            </div>
        `;
        
        // 将导航添加到报告面板而不是内容容器，确保它始终可见
        const reportPanel = document.getElementById('reportPanel');
        if (reportPanel) {
            reportPanel.appendChild(nav);
        } else {
            container.appendChild(nav);
        }
        this.bindDouBaoNavigationEvents(nav);
    },

    // 创建豆包风格的报告头部
    createDouBaoHeader(metadata) {
        const header = document.createElement('div');
        header.className = 'doubao-header bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl';
        header.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h1 class="text-3xl font-bold mb-4 leading-tight">${metadata.title}</h1>
                    <div class="grid grid-cols-2 gap-6 text-blue-100">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-clock text-blue-200"></i>
                            <span class="text-sm">${metadata.generatedAt.toLocaleString('zh-CN')}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-tag text-blue-200"></i>
                            <span class="text-sm">版本 ${metadata.version}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-users text-blue-200"></i>
                            <span class="text-sm">${metadata.participants.join('、')}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-stopwatch text-blue-200"></i>
                            <span class="text-sm">${metadata.duration}</span>
                        </div>
                    </div>
                </div>
                <div class="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <i class="fas fa-chart-line text-3xl text-white"></i>
                </div>
            </div>
        `;
        return header;
    },

    // 创建豆包风格的章节
    createDouBaoSection(sectionId, section, index) {
        const sectionColors = [
            'from-blue-50 to-blue-100 border-blue-200',      // 项目概述
            'from-green-50 to-green-100 border-green-200',   // 需求分析  
            'from-purple-50 to-purple-100 border-purple-200', // 测试策略
            'from-orange-50 to-orange-100 border-orange-200', // 技术方案
            'from-yellow-50 to-yellow-100 border-yellow-200', // 最佳实践
            'from-red-50 to-red-100 border-red-200'         // 专家建议
        ];

        const iconColors = [
            'text-blue-600', 'text-green-600', 'text-purple-600', 
            'text-orange-600', 'text-yellow-600', 'text-red-600'
        ];

        const icons = [
            'fas fa-file-alt', 'fas fa-clipboard-list', 'fas fa-chess',
            'fas fa-cogs', 'fas fa-star', 'fas fa-lightbulb'
        ];

        const colorClass = sectionColors[index % sectionColors.length];
        const iconColor = iconColors[index % iconColors.length];
        const icon = icons[index % icons.length];

        const sectionElement = document.createElement('div');
        sectionElement.className = `doubao-section bg-gradient-to-br ${colorClass} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`;
        sectionElement.id = `section-${sectionId}`;

        let content = `
            <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                    <i class="${icon} ${iconColor} text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">${section.title}</h2>
            </div>
        `;

        // 处理章节内容
        if (section.content !== undefined) {
            content += `<div class="doubao-content bg-white/70 backdrop-blur-sm rounded-xl p-6">`;
            if (typeof section.content === 'string') {
                content += `<div class="prose max-w-none text-gray-700 leading-relaxed">${this.formatMarkdownContent(section.content)}</div>`;
            } else if (Array.isArray(section.content)) {
                content += `<ul class="space-y-3">`;
                section.content.forEach(item => {
                    content += `<li class="flex items-start space-x-3">
                        <div class="w-2 h-2 ${iconColor.replace('text-', 'bg-')} rounded-full mt-2 flex-shrink-0"></div>
                        <span class="text-gray-700 leading-relaxed">${item}</span>
                    </li>`;
                });
                content += `</ul>`;
            } else if (typeof section.content === 'object') {
                content += this.renderDouBaoSectionContent(section.content, iconColor);
            }
            content += `</div>`;
        } else {
            // 处理扁平化对象结构
            const sectionData = { ...section };
            delete sectionData.title;
            
            if (Object.keys(sectionData).length > 0) {
                content += `<div class="doubao-content bg-white/70 backdrop-blur-sm rounded-xl p-6">`;
                content += this.renderDouBaoSectionContent(sectionData, iconColor);
                content += `</div>`;
            }
        }

        sectionElement.innerHTML = content;
        return sectionElement;
    },

    // 渲染豆包风格的章节内容
    renderDouBaoSectionContent(content, iconColor) {
        let html = '';
        
        Object.entries(content).forEach(([key, value]) => {
            html += `<div class="mb-6 last:mb-0">`;
            html += `<div class="flex items-center mb-4">
                <div class="w-6 h-6 ${iconColor.replace('text-', 'bg-')} rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-circle text-white text-xs"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800">${this.formatSectionTitle(key)}</h3>
            </div>`;
            
            if (Array.isArray(value)) {
                html += `<div class="grid gap-3">`;
                value.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        // 处理对象数组
                        if (item.hasOwnProperty('name') || item.hasOwnProperty('title')) {
                            const name = item.name || item.title;
                            const description = item.description || item.details || '';
                            html += `<div class="bg-white/60 rounded-lg p-4 border border-gray-200 hover:bg-white/80 transition-colors">
                                <div class="font-medium text-gray-800 mb-1">${name}</div>
                                ${description ? `<div class="text-sm text-gray-600">${description}</div>` : ''}
                            </div>`;
                        } else {
                            // 对象键值对
                            const objContent = Object.entries(item)
                                .filter(([k, v]) => v !== null && v !== undefined && v !== '')
                                .map(([k, v]) => `<div class="text-sm"><span class="font-medium text-gray-700">${this.formatSectionTitle(k)}</span>: <span class="text-gray-600">${v}</span></div>`)
                                .join('');
                            html += `<div class="bg-white/60 rounded-lg p-4 border border-gray-200 hover:bg-white/80 transition-colors">
                                ${objContent}
                            </div>`;
                        }
                    } else {
                        // 字符串项
                        html += `<div class="flex items-start space-x-3 bg-white/60 rounded-lg p-4 border border-gray-200 hover:bg-white/80 transition-colors">
                            <div class="w-2 h-2 ${iconColor.replace('text-', 'bg-')} rounded-full mt-2 flex-shrink-0"></div>
                            <span class="text-gray-700 leading-relaxed">${this.formatMarkdownContent(item.toString())}</span>
                        </div>`;
                    }
                });
                html += `</div>`;
            } else if (typeof value === 'string') {
                html += `<div class="bg-white/60 rounded-lg p-4 border border-gray-200">
                    <div class="text-gray-700 leading-relaxed">${this.formatMarkdownContent(value)}</div>
                </div>`;
            } else if (typeof value === 'object' && value !== null) {
                html += this.renderDouBaoSectionContent(value, iconColor);
            } else {
                html += `<div class="bg-white/60 rounded-lg p-4 border border-gray-200">
                    <span class="text-gray-700">${value}</span>
                </div>`;
            }
            
            html += `</div>`;
        });
        
        return html;
    },

    // 绑定豆包风格导航事件
    bindDouBaoNavigationEvents(nav) {
        // 折叠/展开导航
        const toggleBtn = nav.querySelector('.nav-toggle-btn');
        const content = nav.querySelector('.nav-content');
        const icon = toggleBtn.querySelector('i');
        
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            icon.classList.toggle('fa-chevron-down', isCollapsed);
            icon.classList.toggle('fa-chevron-up', !isCollapsed);
        });

        // 平滑滚动到章节
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // 高亮当前导航项
                    nav.querySelectorAll('.nav-link').forEach(l => {
                        l.classList.remove('bg-blue-100', 'font-semibold');
                        l.querySelector('span').classList.remove('text-blue-700');
                    });
                    
                    link.classList.add('bg-blue-100', 'font-semibold');
                    link.querySelector('span').classList.add('text-blue-700');
                    
                    // 平滑滚动到目标位置
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 添加闪烁动画
                    targetElement.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        targetElement.style.transform = 'scale(1)';
                    }, 200);
                }
            });
        });

        // 监听滚动，高亮当前章节
        const reportContainer = document.getElementById('reportContent');
        if (reportContainer) {
            reportContainer.addEventListener('scroll', () => {
                this.updateDouBaoActiveNavigation(nav);
            });
        }
    },

    // 更新豆包风格的活跃导航项
    updateDouBaoActiveNavigation(nav) {
        const sections = document.querySelectorAll('[id^="section-"]');
        const navLinks = nav.querySelectorAll('.nav-link');
        const reportContainer = document.getElementById('reportContent');
        
        if (!reportContainer) return;

        let activeSection = null;
        const containerTop = reportContainer.scrollTop;
        const containerHeight = reportContainer.clientHeight;

        // 找到当前可见的章节
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const containerRect = reportContainer.getBoundingClientRect();
            const relativeTop = rect.top - containerRect.top;
            
            if (relativeTop <= containerHeight / 3 && relativeTop >= -rect.height / 2) {
                activeSection = section.id;
            }
        });

        // 更新导航高亮
        navLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            const isActive = targetId === activeSection;
            
            link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('font-semibold', isActive);
            link.querySelector('span').classList.toggle('text-blue-700', isActive);
        });
    },

    // 创建报告头部
    createReportHeader(metadata) {
        const header = document.createElement('div');
        header.className = 'mb-8 p-6 bg-blue-50 rounded-lg';
        header.innerHTML = `
            <h1 class="text-2xl font-bold text-blue-900 mb-4">${metadata.title}</h1>
            <div class="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                    <span class="font-medium">生成时间：</span>
                    ${metadata.generatedAt.toLocaleString('zh-CN')}
                </div>
                <div>
                    <span class="font-medium">版本：</span>
                    ${metadata.version}
                </div>
                <div>
                    <span class="font-medium">参与专家：</span>
                    ${metadata.participants.join('、')}
                </div>
                <div>
                    <span class="font-medium">讨论时长：</span>
                    ${metadata.duration}
                </div>
            </div>
        `;
        return header;
    },

    // 创建报告章节
    createReportSection(sectionId, section) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'mb-6 p-4 bg-white rounded-lg border border-gray-200';
        sectionElement.id = `section-${sectionId}`;

        let content = `<h2 class="text-xl font-bold text-gray-800 mb-4">${section.title}</h2>`;

        // 处理有明确content属性的情况
        if (section.content !== undefined) {
            if (typeof section.content === 'string') {
                content += `<div class="prose max-w-none">${section.content}</div>`;
            } else if (Array.isArray(section.content)) {
                content += `<ul class="list-disc pl-6 space-y-2">`;
                section.content.forEach(item => {
                    content += `<li class="text-gray-700">${item}</li>`;
                });
                content += `</ul>`;
            } else if (typeof section.content === 'object') {
                content += this.renderSectionContent(section.content);
            }
        } else {
            // 处理扁平化对象结构（除title外的所有属性作为内容）
            const sectionData = { ...section };
            delete sectionData.title; // 移除title，其余作为内容
            
            if (Object.keys(sectionData).length > 0) {
                content += this.renderSectionContent(sectionData);
            }
        }

        sectionElement.innerHTML = content;
        return sectionElement;
    },

    // 渲染章节内容
    renderSectionContent(content) {
        let html = '';
        
        Object.entries(content).forEach(([key, value]) => {
            html += `<div class="mb-6">`;
            html += `<h3 class="text-lg font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-1">${this.formatSectionTitle(key)}</h3>`;
            
            if (Array.isArray(value)) {
                html += `<ul class="list-disc pl-6 space-y-2">`;
                value.forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        // 处理对象数组 - 修复 [object Object] 显示问题
                        if (item.hasOwnProperty('name') || item.hasOwnProperty('title')) {
                            // 如果对象有name或title属性，优先显示
                            const name = item.name || item.title;
                            const description = item.description || item.details || '';
                            html += `<li class="text-gray-700 leading-relaxed"><strong>${name}</strong>${description ? ': ' + description : ''}</li>`;
                        } else {
                            // 否则将对象的键值对格式化显示
                            const objContent = Object.entries(item)
                                .filter(([k, v]) => v !== null && v !== undefined && v !== '')
                                .map(([k, v]) => `${this.formatSectionTitle(k)}: ${v}`)
                                .join(', ');
                            if (objContent) {
                                html += `<li class="text-gray-700 leading-relaxed">${objContent}</li>`;
                            }
                        }
                    } else if (typeof item === 'string' && item.trim()) {
                        html += `<li class="text-gray-700 leading-relaxed">${item}</li>`;
                    }
                    // 忽略空值、null、undefined
                });
                html += `</ul>`;
            } else if (typeof value === 'object' && value !== null) {
                html += this.renderSectionContent(value);
            } else if (value) {
                // 对文本内容进行markdown格式化处理
                const formattedContent = this.formatMarkdownContent(value);
                html += `<div class="prose max-w-none text-gray-700">${formattedContent}</div>`;
            }
            
            html += `</div>`;
        });
        
        return html;
    },

    // 格式化Markdown内容
    formatMarkdownContent(text) {
        if (!text || typeof text !== 'string') return text;
        
        // 预处理：清理和标准化内容
        let content = this.preprocessMarkdownContent(text);
        
        // 按行处理
        const lines = content.split('\n');
        const processedLines = [];
        let inList = false;
        let lastWasHeader = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (!line) {
                // 空行处理 - 智能间距
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                
                // 如果上一行是标题，减少间距
                if (lastWasHeader) {
                    processedLines.push('<div class="my-2"></div>');
                } else {
                    processedLines.push('<div class="my-4"></div>');
                }
                lastWasHeader = false;
                continue;
            }
            
            let isHeader = false;
            
            // 处理复合标题（如包含多个#的情况）
            // 强化检测：匹配形如 "### title #### subtitle" 的模式
            if (line.match(/\#{2,4}\s+[^#]*\#{2,4}/) || 
                (line.indexOf('###') !== -1 && line.indexOf('####') !== -1) ||
                (line.indexOf('##') !== -1 && line.indexOf('###') !== -1 && line.indexOf('##') < line.indexOf('###'))) {
                line = this.processComplexHeader(line);
                isHeader = true;
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
            }
            // 处理标准标题
            else if (line.match(/^#{1,4}\s/)) {
                line = this.processStandardHeader(line);
                isHeader = true;
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
            }
            // 处理列表项（包括嵌套列表）
            else if (line.match(/^-\s+/) || line.match(/^\s*-\s+/)) {
                const listResult = this.processListItem(line, inList);
                line = listResult.html;
                if (!inList && listResult.startList) {
                    processedLines.push('<ul class="space-y-2">');
                    inList = true;
                }
                isHeader = false;
            }
            // 处理普通段落
            else {
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                
                line = this.processParagraph(line);
                isHeader = false;
            }
            
            processedLines.push(line);
            lastWasHeader = isHeader;
        }
        
        // 确保列表正确关闭
        if (inList) {
            processedLines.push('</ul>');
        }
        
        return processedLines.join('');
    },

    // 预处理markdown内容
    preprocessMarkdownContent(text) {
        // 第一步：基础清理
        let content = text
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+$/gm, '');

        // 第二步：处理复合标题（重点优化）
        // 匹配如 "### title #### subtitle" 或 "### title #### subtitle - content"
        content = content.replace(/(\#{2,4}\s+[^#\n]+?)(\s+\#{2,4}\s+)/g, (match, title1, marker2) => {
            // 将复合标题分离成独立的行
            return title1.trim() + '\n\n' + marker2.trim() + ' ';
        });

        // 第三步：确保标题独占行
        content = content
            // 标题前后添加空行
            .replace(/([^\n])\n(\#{1,4}\s)/g, '$1\n\n$2')
            .replace(/(\#{1,4}[^\n]*)\n([^\n#\s-])/g, '$1\n\n$2')
            // 修复列表项格式
            .replace(/([^\n])\n(-\s)/g, '$1\n\n$2')
            // 最终清理多余空行
            .replace(/\n{4,}/g, '\n\n\n');

        return content;
    },

    // 测试复合标题处理（开发调试用）
    testComplexHeaderProcessing() {
        const testCases = [
            "### 测试策略专业建议 #### 策略框架",
            "### 总体方法 #### 执行建议 - 制定详细计划",
            "## 测试策略 ### 分层测试 #### 具体实施"
        ];

        console.log('🧪 测试复合标题处理：');
        testCases.forEach((testCase, index) => {
            console.log(`\n测试案例 ${index + 1}: ${testCase}`);
            
            // 预处理
            const preprocessed = this.preprocessMarkdownContent(testCase);
            console.log('预处理结果:', preprocessed);
            
            // 最终处理
            const result = this.formatMarkdownContent(testCase);
            console.log('最终HTML:', result);
        });
    },

    // 处理复合标题（包含多个标题标记的行）
    processComplexHeader(line) {
        // 使用更强的正则表达式来分离复合标题
        const headerPattern = /(\#{2,4}\s*[^#]+?)(?=\s*\#{2,4}|$)/g;
        const matches = [...line.matchAll(headerPattern)];
        
        if (matches.length > 1) {
            // 确实是复合标题，分离处理
            let result = '';
            
            matches.forEach((match, index) => {
                const headerText = match[1].trim();
                if (headerText) {
                    // 分析标题级别
                    const levelMatch = headerText.match(/^(\#{2,4})\s*(.+)/);
                    if (levelMatch) {
                        const level = levelMatch[1].length;
                        const title = levelMatch[2].trim();
                        result += this.createHeaderHtml(level, title);
                        
                        // 除了最后一个标题，都添加一个空行间隔
                        if (index < matches.length - 1) {
                            result += '<div class="my-3"></div>';
                        }
                    } else {
                        // 没有标题标记，当作普通段落
                        result += this.processParagraph(headerText);
                    }
                }
            });
            
            return result;
        } else {
            // 单个标题，使用标准处理
            return this.processStandardHeader(line);
        }
    },

    // 处理标准标题
    processStandardHeader(line) {
        if (line.match(/^#{4,}\s/)) {
            const title = line.replace(/^#{4,}\s*/, '');
            return this.createHeaderHtml(4, title);
        } else if (line.match(/^#{3}\s/)) {
            const title = line.replace(/^#{3}\s*/, '');
            return this.createHeaderHtml(3, title);
        } else if (line.match(/^#{2}\s/)) {
            const title = line.replace(/^#{2}\s*/, '');
            return this.createHeaderHtml(2, title);
        } else if (line.match(/^#{1}\s/)) {
            const title = line.replace(/^#{1}\s*/, '');
            return this.createHeaderHtml(1, title);
        }
        return line;
    },

    // 创建标题HTML
    createHeaderHtml(level, title) {
        const processedTitle = this.processInlineFormatting(title);
        
        switch(level) {
            case 1:
                return `<h1 class="text-2xl font-bold text-blue-900 mt-8 mb-6 bg-blue-50 p-3 rounded">${processedTitle}</h1>`;
            case 2:
                return `<h2 class="text-xl font-bold text-blue-800 mt-8 mb-4 border-b border-blue-300 pb-2">${processedTitle}</h2>`;
            case 3:
                return `<h3 class="text-lg font-bold text-blue-700 mt-6 mb-3 border-l-4 border-blue-500 pl-3">${processedTitle}</h3>`;
            case 4:
            default:
                return `<h4 class="text-base font-semibold text-gray-800 mt-4 mb-2 flex items-center">
                    <span class="w-1 h-4 bg-blue-500 mr-2 flex-shrink-0"></span>${processedTitle}
                </h4>`;
        }
    },

    // 处理列表项
    processListItem(line, inList) {
        // 检测缩进级别
        const indent = line.match(/^(\s*)/)[1].length;
        const listContent = line.replace(/^\s*-\s*/, '');
        const processedContent = this.processInlineFormatting(listContent);
        
        // 根据缩进创建不同级别的列表
        const marginClass = indent > 0 ? 'ml-6' : 'ml-0';
        
        return {
            html: `<li class="flex items-start ${marginClass} mb-2">
                <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span class="flex-1 leading-relaxed">${processedContent}</span>
            </li>`,
            startList: !inList
        };
    },

    // 处理段落
    processParagraph(line) {
        const processedText = this.processInlineFormatting(line);
        
        // 检查是否是分隔线
        if (line.match(/^-{3,}$/)) {
            return '<hr class="my-6 border-gray-300">';
        }
        
        // 长段落自动分行
        if (processedText.length > 150) {
            return `<div class="mb-4 leading-relaxed text-gray-700">${processedText}</div>`;
        } else {
            return `<p class="mb-3 leading-relaxed text-gray-700">${processedText}</p>`;
        }
    },

    // 处理行内格式化
    processInlineFormatting(text) {
        return text
            // 粗体
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
            // 代码
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>');
    },

    // 格式化章节标题
    formatSectionTitle(key) {
        const titleMap = {
            // 需求分析相关
            'originalRequirements': '原始需求',
            'keyFunctions': '关键功能',
            'scope': '测试范围',
            'constraints': '约束条件',
            'acceptance_criteria': '验收标准',
            
            // 测试策略相关
            'overall_approach': '总体方法',
            'test_types': '测试类型',
            'test_levels': '测试层级',
            'coverage_criteria': '覆盖标准',
            
            // 技术方案相关
            'recommended_tools': '推荐工具',
            'automation_framework': '自动化框架',
            'implementation_steps': '实施步骤',
            'technical_requirements': '技术要求',
            
            // 已删除：风险评估、成本评估、时间规划、交付物相关映射
            
            // 最佳实践相关
            'industry_standards': '行业标准',
            'process_improvements': '流程改进',
            'quality_assurance': '质量保证',
            
            // 建议相关
            'immediate_actions': '立即行动',
            'long_term_strategy': '长期策略',
            'next_steps': '下一步行动',
            
            // 通用字段
            'content': '内容',
            'projectInfo': '项目信息',
            'keyHighlights': '关键亮点',
            'summary': '摘要',
            'conclusion': '结论'
        };
        
        return titleMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    // 添加报告导航 (旧版本，已弃用)
    addReportNavigation_deprecated(container) {
        // 先清除已存在的导航
        const existingNav = container.querySelector('.report-navigation');
        if (existingNav) {
            existingNav.remove();
        }

        const nav = document.createElement('div');
        nav.className = 'report-navigation sticky top-0 bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6 z-10';
        nav.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-gray-800 flex items-center">
                    <i class="fas fa-list-ul mr-2 text-blue-600"></i>
                    报告导航
                </h4>
                <button class="nav-toggle-btn text-sm text-gray-500 hover:text-gray-700" title="折叠/展开导航">
                    <i class="fas fa-chevron-up transition-transform"></i>
                </button>
            </div>
            <div class="nav-content">
                <ul class="grid grid-cols-2 gap-2 text-sm">
                    <li><a href="#section-executive_summary" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-file-alt mr-2 text-blue-500 w-4"></i>
                        <span>项目概述</span>
                    </a></li>
                    <li><a href="#section-requirements_analysis" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-clipboard-list mr-2 text-green-500 w-4"></i>
                        <span>需求分析</span>
                    </a></li>
                    <li><a href="#section-test_strategy" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-chess mr-2 text-purple-500 w-4"></i>
                        <span>测试策略</span>
                    </a></li>
                    <li><a href="#section-technical_approach" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-cogs mr-2 text-orange-500 w-4"></i>
                        <span>技术方案</span>
                    </a></li>
                    <li><a href="#section-best_practices" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-star mr-2 text-yellow-500 w-4"></i>
                        <span>最佳实践</span>
                    </a></li>
                    <li><a href="#section-recommendations" class="nav-link flex items-center p-2 rounded hover:bg-blue-50 transition-colors">
                        <i class="fas fa-lightbulb mr-2 text-red-500 w-4"></i>
                        <span>专家建议</span>
                    </a></li>
                </ul>
            </div>
        `;
        
        // 将导航添加到报告容器的开头
        container.insertBefore(nav, container.firstChild);
        
        // 绑定导航事件
        this.bindNavigationEvents_deprecated(nav);
    },

    // 绑定导航事件 (旧版本，已弃用)
    bindNavigationEvents_deprecated(nav) {
        // 折叠/展开导航
        const toggleBtn = nav.querySelector('.nav-toggle-btn');
        const content = nav.querySelector('.nav-content');
        const icon = toggleBtn.querySelector('i');
        
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            icon.classList.toggle('fa-chevron-up', isCollapsed);
            icon.classList.toggle('fa-chevron-down', !isCollapsed);
        });

        // 平滑滚动到章节
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // 高亮当前导航项
                    nav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('bg-blue-100', 'font-semibold'));
                    link.classList.add('bg-blue-100', 'font-semibold');
                    
                    // 平滑滚动到目标位置
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 监听滚动，高亮当前章节
        const reportContainer = document.getElementById('reportContent');
        if (reportContainer) {
            reportContainer.addEventListener('scroll', () => {
                this.updateActiveNavigation_deprecated(nav);
            });
        }
    },

    // 更新活跃的导航项 (旧版本，已弃用)
    updateActiveNavigation_deprecated(nav) {
        const sections = document.querySelectorAll('[id^="section-"]');
        const navLinks = nav.querySelectorAll('.nav-link');
        const reportContainer = document.getElementById('reportContent');
        
        if (!reportContainer) return;

        let activeSection = null;
        const containerTop = reportContainer.scrollTop;
        const containerHeight = reportContainer.clientHeight;

        // 找到当前可见的章节
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const containerRect = reportContainer.getBoundingClientRect();
            const relativeTop = rect.top - containerRect.top;
            
            if (relativeTop <= containerHeight / 3 && relativeTop >= -rect.height) {
                activeSection = section.id;
            }
        });

        // 更新导航高亮
        navLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            const isActive = targetId === activeSection;
            
            link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('font-semibold', isActive);
        });
    },

    // 显示报告面板
    showReportPanel() {
        if (window.App && window.App.elements && window.App.elements.reportPanel) {
            window.App.elements.reportPanel.classList.add('show');
        }
    },

    // 更新报告
    updateReport(conversation) {
        if (this.state.isGenerating) return;
        
        console.log('🔄 更新测试方案报告...');
        this.generateReport(conversation);
    },

    // 导出为PDF
    async exportToPDF() {
        if (!this.state.currentReport) {
            window.App?.showNotification('请先生成报告', 'warning');
            return;
        }

        try {
            console.log('📄 正在导出PDF...');
            
            // 这里应该集成PDF生成库，如jsPDF
            // 由于是演示，这里只是模拟
            window.App?.showNotification('PDF导出功能开发中...', 'info');
            
        } catch (error) {
            console.error('PDF导出失败:', error);
            window.App?.showNotification('PDF导出失败', 'error');
        }
    },

    // 导出为Word
    async exportToWord() {
        if (!this.state.currentReport) {
            window.App?.showNotification('请先生成报告', 'warning');
            return;
        }

        try {
            console.log('📄 正在导出Word...');
            
            // 这里应该集成Word生成库
            // 由于是演示，这里只是模拟
            window.App?.showNotification('Word导出功能开发中...', 'info');
            
        } catch (error) {
            console.error('Word导出失败:', error);
            window.App?.showNotification('Word导出失败', 'error');
        }
    },

    // 生成分享链接
    generateShareLink() {
        try {
            if (!this.state.currentReport) {
                window.App?.showNotification('请先生成报告', 'warning');
                return;
            }

            // 生成分享数据
            const shareData = {
                id: Date.now().toString(36),
                timestamp: new Date().toISOString(),
                title: this.state.currentReport?.metadata?.title || '测试方案报告',
                summary: this.state.currentReport?.sections?.executiveSummary?.content || '无摘要'
            };

            // 保存到本地存储，供分享链接访问
            const shareKey = `aigent_share_${shareData.id}`;
            localStorage.setItem(shareKey, JSON.stringify({
                ...shareData,
                report: this.state.currentReport
            }));

            // 生成分享链接
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareData.id}`;
            
            console.log('🔗 生成分享链接:', shareUrl);
            
            // 复制到剪贴板
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    window.App?.showNotification('分享链接已复制到剪贴板！', 'success');
                    this.showShareSuccess(shareUrl);
                }).catch((error) => {
                    console.error('剪贴板复制失败:', error);
                    this.fallbackCopyToClipboard(shareUrl);
                });
            } else {
                this.fallbackCopyToClipboard(shareUrl);
            }
            
        } catch (error) {
            console.error('❌ 生成分享链接失败:', error);
            window.App?.showNotification('生成分享链接失败，请稍后重试', 'error');
        }
    },

    // 显示分享成功提示
    showShareSuccess(shareUrl) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full m-4 p-6">
                <div class="text-center">
                    <div class="text-green-600 text-5xl mb-4">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">分享链接生成成功！</h3>
                    <p class="text-gray-600 mb-4">链接已复制到剪贴板，您可以分享给其他人查看报告。</p>
                    <div class="bg-gray-100 p-3 rounded border text-sm text-gray-700 mb-4 break-all">
                        ${shareUrl}
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                            确定
                        </button>
                        <button onclick="navigator.clipboard.writeText('${shareUrl}'); window.App?.showNotification('重新复制成功', 'success')" 
                                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                            重新复制
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    },

    // 备用复制方法
    fallbackCopyToClipboard(shareUrl) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                window.App?.showNotification('分享链接已复制到剪贴板！', 'success');
                this.showShareSuccess(shareUrl);
            } else {
                this.manualCopyPrompt(shareUrl);
            }
        } catch (error) {
            console.error('备用复制方法失败:', error);
            this.manualCopyPrompt(shareUrl);
        }
    },

    // 手动复制提示
    manualCopyPrompt(shareUrl) {
        const result = prompt(
            '自动复制失败，请手动复制以下链接:\n\n' + 
            '(按 Ctrl+A 全选，然后 Ctrl+C 复制)', 
            shareUrl
        );
        
        if (result !== null) {
            window.App?.showNotification('请手动复制链接', 'info');
        }
    },

    // 辅助方法：计算对话时长
    calculateDuration(messages) {
        if (messages.length < 2) return '0分钟';
        
        const first = new Date(messages[0].timestamp);
        const last = new Date(messages[messages.length - 1].timestamp);
        const diffMinutes = Math.floor((last - first) / 60000);
        
        if (diffMinutes < 60) {
            return `${diffMinutes}分钟`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours}小时${minutes}分钟`;
        }
    },

    // 辅助方法：提取关键话题
    extractKeyTopics(messages) {
        const allContent = messages
            .filter(msg => msg.type !== 'system')
            .map(msg => msg.content)
            .join(' ');
        
        const keywords = ['功能测试', '性能测试', '安全测试', '自动化测试', '接口测试', 'UI测试'];
        return keywords.filter(keyword => allContent.includes(keyword));
    },

    // 辅助方法：评估复杂度
    assessComplexity(userMessages) {
        const totalLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0);
        
        if (totalLength > 500) return '高';
        if (totalLength > 200) return '中';
        return '低';
    },

    // 辅助方法：识别范围
    identifyScope(userMessages) {
        const content = userMessages.map(msg => msg.content).join(' ').toLowerCase();
        const scopes = [];
        
        if (content.includes('web') || content.includes('网站')) scopes.push('Web应用');
        if (content.includes('mobile') || content.includes('手机')) scopes.push('移动应用');
        if (content.includes('api') || content.includes('接口')) scopes.push('API接口');
        if (content.includes('database') || content.includes('数据库')) scopes.push('数据库');
        
        return scopes.length > 0 ? scopes : ['通用测试'];
    },

    // 更多辅助方法...
    extractKeyPoints(content) {
        // 简单实现：提取包含"建议"、"推荐"等关键词的句子
        const sentences = content.split(/[。！？]/);
        return sentences.filter(sentence => 
            sentence.includes('建议') || 
            sentence.includes('推荐') || 
            sentence.includes('应该') ||
            sentence.includes('需要')
        ).slice(0, 3);
    },

    generateNextSteps(expertInsights) {
        return [
            '确认项目范围和优先级',
            '搭建测试环境',
            '准备测试数据',
            '开始测试用例设计',
            '配置自动化测试框架'
        ];
    },

    // 导出为PDF
    exportToPDF() {
        if (!this.state.currentReport) {
            alert('请先生成报告后再导出');
            return;
        }

        try {
            // 获取报告内容
            const reportContent = document.getElementById('reportContent');
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>测试方案报告</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h1, h2, h3 { color: #1e40af; }
                        .section { margin-bottom: 30px; }
                        .metadata { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        ul, ol { margin-left: 20px; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${reportContent.innerHTML}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // 延迟执行打印对话框
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
            console.log('📄 PDF导出功能已触发（使用浏览器打印功能）');
            
        } catch (error) {
            console.error('❌ PDF导出失败:', error);
            alert('PDF导出失败，请稍后重试');
        }
    },

    // 导出为Word
    exportToWord() {
        if (!this.state.currentReport) {
            alert('请先生成报告后再导出');
            return;
        }

        try {
            // 创建Word文档内容
            const reportContent = document.getElementById('reportContent');
            const htmlContent = reportContent.innerHTML;
            
            // 创建Word格式的HTML
            const wordContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>测试方案报告</title>
                    <!--[if gte mso 9]>
                    <xml>
                        <w:WordDocument>
                            <w:View>Print</w:View>
                            <w:Zoom>90</w:Zoom>
                            <w:DoNotPromptForConvert/>
                            <w:DoNotShowInsertionsAndDeletions/>
                        </w:WordDocument>
                    </xml>
                    <![endif]-->
                    <style>
                        body { font-family: '宋体', Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
                        h1 { font-size: 18pt; color: #1e40af; }
                        h2 { font-size: 16pt; color: #1e40af; }
                        h3 { font-size: 14pt; color: #1e40af; }
                        .metadata { background: #f3f4f6; padding: 15px; border: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;
            
            // 创建Blob并下载
            const blob = new Blob([wordContent], {
                type: 'application/msword'
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `测试方案报告_${new Date().toISOString().split('T')[0]}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('📄 Word文档导出完成');
            
        } catch (error) {
            console.error('❌ Word导出失败:', error);
            alert('Word导出失败，请稍后重试');
        }
    },



    // ==================== 缺失的辅助函数实现 ====================

    // 计算对话持续时间
    calculateDuration(messages) {
        if (messages.length < 2) return '1分钟';
        const first = new Date(messages[0].timestamp);
        const last = new Date(messages[messages.length - 1].timestamp);
        const diffMinutes = Math.ceil((last - first) / (1000 * 60));
        return `${diffMinutes}分钟`;
    },

    // 提取关键主题
    extractKeyTopics(messages) {
        const userMessages = messages.filter(m => m.type === 'user');
        const content = userMessages.map(m => m.content).join(' ');
        const topics = [];
        
        if (content.includes('网站') || content.includes('web')) topics.push('Web应用');
        if (content.includes('移动') || content.includes('手机') || content.includes('app')) topics.push('移动应用');
        if (content.includes('API') || content.includes('接口')) topics.push('API接口');
        if (content.includes('数据库')) topics.push('数据库');
        if (content.includes('性能')) topics.push('性能测试');
        if (content.includes('安全')) topics.push('安全测试');
        
        return topics.length > 0 ? topics : ['功能测试', '集成测试'];
    },

    // 识别约束条件
    identifyConstraints(userRequirements) {
        const constraints = ['浏览器兼容性要求', '响应时间限制', '数据安全合规'];
        
        // 处理字符串或数组输入
        const requirementsText = Array.isArray(userRequirements) 
            ? userRequirements.join(' ') 
            : (userRequirements || '');
        
        if (requirementsText.includes('时间') || requirementsText.includes('紧急')) {
            constraints.push('时间约束紧迫');
        }
        if (requirementsText.includes('资源') || requirementsText.includes('预算')) {
            constraints.push('预算和资源限制');
        }
        if (requirementsText.includes('技术') || requirementsText.includes('平台')) {
            constraints.push('技术平台限制');
        }
        if (requirementsText.includes('安全') || requirementsText.includes('隐私')) {
            constraints.push('安全性和隐私要求');
        }
        if (requirementsText.includes('性能') || requirementsText.includes('速度')) {
            constraints.push('性能指标要求');
        }
        
        return constraints;
    },

    // 生成验收标准
    generateAcceptanceCriteria(analysis) {
        return [
            '所有核心功能测试用例执行通过率 ≥ 95%',
            '系统响应时间满足性能要求',
            '关键业务流程无阻塞性缺陷',
            '安全测试无高危漏洞',
            '用户体验符合设计规范'
        ];
    },

    // 提取工具推荐
    extractToolRecommendations(techAdvisor) {
        if (!techAdvisor || !techAdvisor.contributions.length) {
            return ['Selenium WebDriver', 'JMeter', 'OWASP ZAP', 'SonarQube'];
        }
        
        const content = techAdvisor.contributions[0].content;
        const tools = [];
        
        if (content.includes('自动化')) tools.push('Selenium WebDriver', 'Cypress');
        if (content.includes('性能')) tools.push('JMeter', 'LoadRunner');
        if (content.includes('安全')) tools.push('OWASP ZAP', 'Burp Suite');
        if (content.includes('API')) tools.push('Postman', 'REST Assured');
        
        return tools.length > 0 ? tools : ['Selenium WebDriver', 'JMeter', 'Postman'];
    },

    // 提取自动化方案
    extractAutomationApproach(techAdvisor) {
        return {
            framework: 'Page Object Model + TestNG',
            languages: ['Java', 'Python'],
            cicd: 'Jenkins + Git'
        };
    },

    // 生成实施步骤
    generateImplementationSteps(techAdvisor) {
        return [
            '环境搭建和工具配置',
            '测试框架设计',
            '测试用例编写',
            '自动化脚本开发',
            'CI/CD集成部署'
        ];
    },

    // 已删除的辅助函数：
    // - extractRisks, generateRiskMatrix, extractMitigationStrategies, generateContingencyPlans
    // - extractResourceEstimates, extractToolCosts, calculateTimelineCosts, calculateTotalCost
    // - extractOptimizationSuggestions, generateMilestones, defineQualityGates
    // 这些函数支持已删除的风险评估、成本估算、时间安排、交付物章节

    // 渲染章节内容
    renderSectionContent(content) {
        if (typeof content === 'string') {
            return `<p class="text-gray-700 mb-2">${content}</p>`;
        }
        
        if (Array.isArray(content)) {
            return `<ul class="list-disc list-inside text-gray-700 space-y-1">
                ${content.map(item => `<li>${item}</li>`).join('')}
            </ul>`;
        }
        
        if (typeof content === 'object') {
            let html = '';
            Object.entries(content).forEach(([key, value]) => {
                html += `<div class="mb-3">
                    <h4 class="font-medium text-gray-800 mb-1">${this.formatSectionTitle(key)}</h4>
                    ${this.renderSectionContent(value)}
                </div>`;
            });
            return html;
        }
        
        return `<p class="text-gray-700">${content}</p>`;
    },

    // 格式化章节标题
    formatSectionTitle(title) {
        const titleMap = {
            'executive_summary': '执行摘要',
            'requirements_analysis': '需求分析',
            'test_strategy': '测试策略',
            'technical_approach': '技术方案',
            'best_practices': '最佳实践',
            'recommendations': '建议',
            'overall_approach': '总体方法',
            'test_types': '测试类型',
            'recommended_tools': '推荐工具',
            'automation_framework': '自动化框架',
            'implementation_steps': '实施步骤'
            // 已删除：风险评估、成本评估、时间规划、交付物相关映射
        };
        
        return titleMap[title] || title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    // ==================== 报告持久化功能 ====================

    // 保存报告到本地存储
    saveReportToStorage(report, conversation) {
        try {
            if (!report || !conversation) {
                console.warn('⚠️ 报告或会话数据缺失，跳过保存');
                return;
            }

            const conversationId = conversation.id;
            const reportData = {
                id: report.id || Date.now().toString(),
                conversationId: conversationId,
                timestamp: new Date().toISOString(),
                report: report,
                title: report.metadata?.title || '测试方案报告',
                summary: report.sections?.executiveSummary?.content || '无摘要'
            };

            // 保存到localStorage
            const reportKey = `aigent_report_${conversationId}`;
            localStorage.setItem(reportKey, JSON.stringify(reportData));

            // 更新报告索引
            this.updateReportIndex(conversationId, reportData);

            console.log('💾 报告已保存到本地存储:', reportKey);

        } catch (error) {
            console.error('❌ 保存报告失败:', error);
        }
    },

    // 从本地存储加载报告
    loadReportFromStorage(conversationId) {
        try {
            const reportKey = `aigent_report_${conversationId}`;
            const reportDataString = localStorage.getItem(reportKey);
            
            if (!reportDataString) {
                console.log('📋 未找到会话对应的报告:', conversationId);
                return null;
            }

            const reportData = JSON.parse(reportDataString);
            
            // 验证数据完整性
            if (reportData.report && reportData.conversationId === conversationId) {
                console.log('📖 成功加载报告:', reportData.title);
                return reportData.report;
            } else {
                console.warn('⚠️ 报告数据不完整或不匹配');
                return null;
            }

        } catch (error) {
            console.error('❌ 加载报告失败:', error);
            return null;
        }
    },

    // 更新报告索引
    updateReportIndex(conversationId, reportData) {
        try {
            const indexKey = 'aigent_reports_index';
            let reportsIndex = {};
            
            const indexString = localStorage.getItem(indexKey);
            if (indexString) {
                reportsIndex = JSON.parse(indexString);
            }

            reportsIndex[conversationId] = {
                title: reportData.title,
                timestamp: reportData.timestamp,
                summary: reportData.summary
            };

            localStorage.setItem(indexKey, JSON.stringify(reportsIndex));

        } catch (error) {
            console.error('❌ 更新报告索引失败:', error);
        }
    },

    // 获取所有保存的报告
    getAllSavedReports() {
        try {
            const indexKey = 'aigent_reports_index';
            const indexString = localStorage.getItem(indexKey);
            
            if (!indexString) {
                return {};
            }

            return JSON.parse(indexString);

        } catch (error) {
            console.error('❌ 获取报告索引失败:', error);
            return {};
        }
    },

    // 删除报告
    deleteReportFromStorage(conversationId) {
        try {
            const reportKey = `aigent_report_${conversationId}`;
            localStorage.removeItem(reportKey);

            // 从索引中移除
            const indexKey = 'aigent_reports_index';
            const indexString = localStorage.getItem(indexKey);
            if (indexString) {
                const reportsIndex = JSON.parse(indexString);
                delete reportsIndex[conversationId];
                localStorage.setItem(indexKey, JSON.stringify(reportsIndex));
            }

            console.log('🗑️ 已删除报告:', conversationId);

        } catch (error) {
            console.error('❌ 删除报告失败:', error);
        }
    },

    // 恢复当前会话的报告
    restoreCurrentSessionReport() {
        try {
            const currentConversation = window.App?.state?.currentConversation;
            if (!currentConversation) {
                console.log('📋 当前无会话，跳过报告恢复');
                return;
            }

            const report = this.loadReportFromStorage(currentConversation.id);
            if (report) {
                this.state.currentReport = report;
                this.state.hasTestContent = true;
                this.renderReport(report);
                console.log('🔄 已恢复当前会话的报告');
                
                // 显示提示
                if (window.App?.showNotification) {
                    window.App.showNotification('已恢复之前生成的测试报告', 'info');
                }
            } else {
                // 检查是否包含测试内容
                if (this.hasTestRelatedContent(currentConversation)) {
                    console.log('📋 检测到测试内容，但无保存的报告，准备生成...');
                    this.state.hasTestContent = true;
                    // 不立即生成，等待用户触发或专家回复时生成
                } else {
                    console.log('📋 当前会话无测试内容');
                    this.state.hasTestContent = false;
                    this.renderEmptyReport();
                }
            }

        } catch (error) {
            console.error('❌ 恢复报告失败:', error);
        }
    },

    // 清理过期报告
    cleanupExpiredReports(days = 30) {
        try {
            const indexKey = 'aigent_reports_index';
            const indexString = localStorage.getItem(indexKey);
            
            if (!indexString) return;

            const reportsIndex = JSON.parse(indexString);
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
            let cleanedCount = 0;

            Object.keys(reportsIndex).forEach(conversationId => {
                const reportInfo = reportsIndex[conversationId];
                const reportTime = new Date(reportInfo.timestamp).getTime();
                
                if (reportTime < cutoffTime) {
                    this.deleteReportFromStorage(conversationId);
                    cleanedCount++;
                }
            });

            if (cleanedCount > 0) {
                console.log(`🧹 已清理 ${cleanedCount} 个过期报告`);
            }

        } catch (error) {
            console.error('❌ 清理过期报告失败:', error);
        }
    }
};

// 导出到全局
window.ReportSystem = ReportSystem;
window.ReportsSystem = ReportSystem; // 兼容性别名