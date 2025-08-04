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
                'risk_assessment',
                'cost_estimation',
                'timeline',
                'deliverables',
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
        console.log('✅报告系统初始化完成');
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
        // 只有包含测试相关内容的对话才生成报告
        return this.hasTestRelatedContent(conversation) && this.state.hasTestContent;
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
            projectTitle: conversation.title || '测试项目',
            userRequirements: userMessages.map(msg => msg.content).join('\n'),
            totalMessages: messages.length,
            expertParticipants: [...new Set(aiMessages.map(msg => msg.expert?.name).filter(Boolean))],
            conversationDuration: this.calculateDuration(messages),
            keyTopics: this.extractKeyTopics(messages),
            complexity: this.assessComplexity(userMessages),
            scope: this.identifyScope(userMessages)
        };
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

    // 构建报告
    async buildReport(analysis, expertInsights) {
        const report = {
            metadata: {
                title: `${analysis.projectTitle} - 测试方案报告`,
                generatedAt: new Date(),
                version: '1.0',
                participants: analysis.expertParticipants,
                duration: analysis.conversationDuration
            },
            sections: {}
        };

        // 生成各个报告章节
        try {
            report.sections.executive_summary = this.generateExecutiveSummary(analysis, expertInsights);
            report.sections.requirements_analysis = this.generateRequirementsAnalysis(analysis);
            report.sections.test_strategy = this.generateTestStrategy(expertInsights);
            report.sections.technical_approach = this.generateTechnicalApproach(expertInsights);
            report.sections.risk_assessment = this.generateRiskAssessment(expertInsights);
            report.sections.cost_estimation = this.generateCostEstimation(expertInsights);
            report.sections.timeline = this.generateTimeline(analysis, expertInsights);
            report.sections.deliverables = this.generateDeliverables(expertInsights);
            report.sections.best_practices = this.generateBestPractices(expertInsights);
            report.sections.recommendations = this.generateRecommendations(expertInsights);
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

        return {
            title: '技术实施方案',
            recommended_tools: this.extractToolRecommendations(techAdvisor),
            automation_framework: this.extractAutomationApproach(techAdvisor),
            best_practices: caseResearcher?.keyPoints || [],
            implementation_steps: this.generateImplementationSteps(techAdvisor)
        };
    },

    // 生成风险评估
    generateRiskAssessment(expertInsights) {
        const riskController = expertInsights.risk_controller;

        return {
            title: '风险评估与控制',
            identified_risks: this.extractRisks(riskController),
            risk_matrix: this.generateRiskMatrix(),
            mitigation_strategies: this.extractMitigationStrategies(riskController),
            contingency_plans: this.generateContingencyPlans()
        };
    },

    // 生成成本估算
    generateCostEstimation(expertInsights) {
        const costEstimator = expertInsights.cost_estimator;

        return {
            title: '成本与资源估算',
            human_resources: this.extractResourceEstimates(costEstimator),
            tool_costs: this.extractToolCosts(costEstimator),
            timeline_costs: this.calculateTimelineCosts(),
            total_estimation: this.calculateTotalCost(costEstimator),
            cost_optimization: this.extractOptimizationSuggestions(costEstimator)
        };
    },

    // 生成时间安排
    generateTimeline(analysis, expertInsights) {
        return {
            title: '项目时间安排',
            phases: [
                {
                    name: '准备阶段',
                    duration: '1-2周',
                    activities: ['环境搭建', '工具配置', '团队培训']
                },
                {
                    name: '设计阶段',
                    duration: '2-3周',
                    activities: ['测试用例设计', '自动化脚本开发', '测试数据准备']
                },
                {
                    name: '执行阶段',
                    duration: '3-4周',
                    activities: ['功能测试', '性能测试', '安全测试', '集成测试']
                },
                {
                    name: '总结阶段',
                    duration: '1周',
                    activities: ['缺陷修复验证', '测试报告', '经验总结']
                }
            ],
            milestones: this.generateMilestones(),
            critical_path: ['需求确认', '测试环境就绪', '核心功能验证', '性能指标达标']
        };
    },

    // 生成交付物
    generateDeliverables(expertInsights) {
        const integrator = expertInsights.solution_integrator;

        return {
            title: '项目交付物',
            documents: [
                '测试计划文档',
                '测试用例集',
                '自动化测试脚本',
                '测试执行报告',
                '缺陷报告',
                '性能测试报告',
                '安全测试报告'
            ],
            artifacts: [
                '测试环境配置',
                '测试数据集',
                '工具配置文件',
                '监控仪表板'
            ],
            quality_gates: this.defineQualityGates()
        };
    },

    // 生成最佳实践
    generateBestPractices(expertInsights) {
        const researcher = expertInsights.case_researcher;

        return {
            title: '最佳实践建议',
            testing_practices: researcher?.keyPoints || [
                '早期测试介入',
                '风险驱动测试',
                '持续集成测试',
                '自动化优先'
            ],
            quality_practices: [
                '代码审查',
                '测试用例评审',
                '缺陷跟踪管理',
                '度量分析'
            ],
            process_optimization: [
                '敏捷测试方法',
                'DevOps集成',
                '测试左移',
                '反馈循环优化'
            ]
        };
    },

    // 生成建议
    generateRecommendations(expertInsights) {
        return {
            title: '专家建议',
            immediate_actions: [
                '确认测试环境需求',
                '选定测试工具栈',
                '组建测试团队',
                '制定详细计划'
            ],
            long_term_strategies: [
                '建立测试自动化体系',
                '培养测试技能',
                '完善质量流程',
                '持续改进机制'
            ],
            success_factors: [
                '管理层支持',
                '团队协作',
                '工具支撑',
                '流程规范'
            ],
            next_steps: this.generateNextSteps(expertInsights)
        };
    },

    // 渲染空报告提示
    renderEmptyReport() {
        const container = document.getElementById('reportContent');
        if (!container) {
            console.error('❌ 找不到报告容器元素 #reportContent');
            return;
        }

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="mb-4">
                    <i class="fas fa-comments text-6xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-600 mb-2">当前对话不需要生成测试报告</h3>
                <div class="text-gray-500 max-w-md">
                    <p class="mb-2">这看起来是一个普通对话，不涉及测试方案制定。</p>
                    <p class="text-sm">如需生成测试报告，请在对话中明确提及测试相关需求，例如：</p>
                    <div class="mt-3 text-xs bg-gray-50 rounded-lg p-3 text-left">
                        <p>• "为XX系统制定测试方案"</p>
                        <p>• "需要进行功能测试"</p>
                        <p>• "生成测试计划"</p>
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

        // 渲染报告头部
        try {
            const header = this.createReportHeader(report.metadata);
            container.appendChild(header);
        } catch (error) {
            console.error('❌ 创建报告头部失败:', error);
        }

        // 渲染各个章节
        try {
            Object.entries(report.sections).forEach(([sectionId, section]) => {
                const sectionElement = this.createReportSection(sectionId, section);
                container.appendChild(sectionElement);
            });
        } catch (error) {
            console.error('❌ 渲染章节失败:', error);
        }

        // 添加导航
        try {
            this.addReportNavigation(container);
        } catch (error) {
            console.error('❌ 添加导航失败:', error);
        }
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
            html += `<div class="mb-4">`;
            html += `<h3 class="font-medium text-gray-800 mb-2">${this.formatSectionTitle(key)}</h3>`;
            
            if (Array.isArray(value)) {
                html += `<ul class="list-disc pl-6 space-y-1">`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        // 处理对象数组（如风险列表）
                        const objContent = Object.entries(item).map(([k, v]) => `${this.formatSectionTitle(k)}: ${v}`).join(', ');
                        html += `<li class="text-gray-700">${objContent}</li>`;
                    } else {
                        html += `<li class="text-gray-700">${item}</li>`;
                    }
                });
                html += `</ul>`;
            } else if (typeof value === 'object' && value !== null) {
                html += this.renderSectionContent(value);
            } else if (value) {
                html += `<p class="text-gray-700">${value}</p>`;
            }
            
            html += `</div>`;
        });
        
        return html;
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
            
            // 风险评估相关
            'identified_risks': '识别的风险',
            'risk_matrix': '风险矩阵',
            'mitigation_strategies': '缓解策略',
            'contingency_plans': '应急计划',
            
            // 成本评估相关
            'human_resources': '人力资源',
            'tool_costs': '工具成本',
            'timeline_costs': '时间成本',
            'total_estimation': '总成本估算',
            'cost_optimization': '成本优化建议',
            
            // 时间规划相关
            'milestones': '里程碑',
            'phases': '阶段划分',
            'quality_gates': '质量门禁',
            'dependencies': '依赖关系',
            
            // 交付物相关
            'documents': '文档交付物',
            'test_artifacts': '测试制品',
            'reports': '报告类型',
            
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

    // 添加报告导航
    addReportNavigation(container) {
        const nav = document.createElement('div');
        nav.className = 'fixed top-20 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-48 hidden lg:block';
        nav.innerHTML = `
            <h4 class="font-bold text-gray-800 mb-2">报告导航</h4>
            <ul class="space-y-1 text-sm">
                <li><a href="#section-executive_summary" class="text-blue-600 hover:text-blue-800">项目概述</a></li>
                <li><a href="#section-requirements_analysis" class="text-blue-600 hover:text-blue-800">需求分析</a></li>
                <li><a href="#section-test_strategy" class="text-blue-600 hover:text-blue-800">测试策略</a></li>
                <li><a href="#section-technical_approach" class="text-blue-600 hover:text-blue-800">技术方案</a></li>
                <li><a href="#section-risk_assessment" class="text-blue-600 hover:text-blue-800">风险评估</a></li>
                <li><a href="#section-cost_estimation" class="text-blue-600 hover:text-blue-800">成本估算</a></li>
                <li><a href="#section-timeline" class="text-blue-600 hover:text-blue-800">时间安排</a></li>
                <li><a href="#section-deliverables" class="text-blue-600 hover:text-blue-800">交付物</a></li>
                <li><a href="#section-recommendations" class="text-blue-600 hover:text-blue-800">专家建议</a></li>
            </ul>
        `;
        
        document.body.appendChild(nav);
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

    // 提取风险
    extractRisks(riskController) {
        const defaultRisks = [
            { risk: '测试环境不稳定', level: '中', probability: '中等' },
            { risk: '测试数据不完整', level: '低', probability: '较低' },
            { risk: '第三方依赖问题', level: '中', probability: '中等' }
        ];
        
        if (!riskController || !riskController.contributions.length) {
            return defaultRisks;
        }
        
        return defaultRisks; // 可以基于专家内容进一步分析
    },

    // 生成风险矩阵
    generateRiskMatrix() {
        return {
            high_high: ['业务关键功能失效'],
            high_medium: ['数据安全漏洞'],
            medium_medium: ['性能不达标', '兼容性问题'],
            low_low: ['界面细节问题']
        };
    },

    // 提取缓解策略
    extractMitigationStrategies(riskController) {
        return [
            '建立稳定的测试环境',
            '制定详细的测试数据准备计划',
            '建立风险监控机制',
            '定期进行风险评估更新'
        ];
    },

    // 生成应急计划
    generateContingencyPlans() {
        return [
            '关键路径测试优先执行',
            '准备备用测试环境',
            '建立快速问题响应机制',
            '制定回滚和降级方案'
        ];
    },

    // 提取资源估算
    extractResourceEstimates(costEstimator) {
        return {
            testers: 3,
            qa_lead: 1,
            automation_engineer: 1,
            duration_weeks: 4
        };
    },

    // 提取工具成本
    extractToolCosts(costEstimator) {
        return [
            { tool: 'LoadRunner专业版', cost: '50,000元/年' },
            { tool: 'Selenium Grid', cost: '免费' },
            { tool: 'JIRA + TestRail', cost: '20,000元/年' }
        ];
    },

    // 计算时间线成本
    calculateTimelineCosts() {
        return {
            planning: '40人时',
            execution: '120人时',
            reporting: '20人时'
        };
    },

    // 计算总成本
    calculateTotalCost(costEstimator) {
        return {
            human_cost: '预计 18-25万元',
            tool_cost: '预计 7-10万元',
            infrastructure_cost: '预计 3-5万元',
            total_range: '28-40万元'
        };
    },

    // 提取优化建议
    extractOptimizationSuggestions(costEstimator) {
        return [
            '优先使用开源测试工具',
            '合理安排测试人员技能搭配',
            '采用分阶段实施降低风险',
            '建立可复用的测试资产'
        ];
    },

    // 生成里程碑
    generateMilestones() {
        return [
            { phase: '测试计划完成', deadline: '第1周', deliverable: '测试计划文档' },
            { phase: '测试用例设计完成', deadline: '第2周', deliverable: '测试用例集' },
            { phase: '自动化框架搭建', deadline: '第3周', deliverable: '自动化测试框架' },
            { phase: '测试执行完成', deadline: '第4周', deliverable: '测试报告' }
        ];
    },

    // 定义质量门禁
    defineQualityGates() {
        return [
            { gate: '单元测试', criteria: '代码覆盖率 ≥ 80%' },
            { gate: '集成测试', criteria: '接口测试通过率 = 100%' },
            { gate: '系统测试', criteria: '功能测试通过率 ≥ 95%' },
            { gate: '验收测试', criteria: '用户验收无阻塞性问题' }
        ];
    },

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
            'risk_assessment': '风险评估',
            'cost_estimation': '成本评估',
            'timeline': '时间规划',
            'deliverables': '交付物',
            'best_practices': '最佳实践',
            'recommendations': '建议',
            'overall_approach': '总体方法',
            'test_types': '测试类型',
            'recommended_tools': '推荐工具',
            'automation_framework': '自动化框架',
            'implementation_steps': '实施步骤',
            'identified_risks': '识别的风险',
            'risk_matrix': '风险矩阵',
            'mitigation_strategies': '缓解策略',
            'contingency_plans': '应急计划'
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
                this.renderReport(report);
                console.log('🔄 已恢复当前会话的报告');
                
                // 显示提示
                if (window.App?.showNotification) {
                    window.App.showNotification('已恢复之前生成的测试报告', 'info');
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