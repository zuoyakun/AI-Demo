/**
 * AIGenTest - AI专家管理系统
 * 负责管理AI专家团队，包括预设专家和自定义专家
 */

window.ExpertSystem = {
    // 专家数据
    experts: [],
    
    // 初始化专家系统
    init() {
        console.log('🤖 初始化AI专家系统...');
        this.loadDefaultExperts();
        this.loadCustomExperts();
        console.log('✅ AI专家系统初始化完成');
    },

    // 加载默认专家
    loadDefaultExperts() {
        this.experts = [
            {
                id: 'requirements_analyst',
                name: '需求分析师',
                avatar: '需',
                role: '需求分析师',
                expertise: ['需求分析', '业务理解', '用户体验', '功能规格'],
                description: '专门负责解析和理解用户的测试需求，将抽象需求转化为具体的测试目标',
                personality: '细致严谨，善于倾听，能够准确理解用户意图',
                priority: 1,
                isDefault: true,
                prompt: `你是一名专业的需求分析师，专门负责：
                1. 深入理解用户的测试需求和业务背景
                2. 识别关键功能点和测试重点
                3. 分析潜在风险和约束条件
                4. 提出澄清问题以获取更多信息
                
                请用专业但易懂的语言与用户沟通，确保准确理解需求。`
            },
            {
                id: 'test_strategist',
                name: '测试策略师',
                avatar: '策',
                role: '测试策略师',
                expertise: ['测试策略', '测试计划', '测试架构', '质量保证'],
                description: '负责设计整体测试策略和测试方案，确保测试覆盖度和有效性',
                personality: '战略思维强，逻辑清晰，善于制定全面的测试计划',
                priority: 2,
                isDefault: true,
                prompt: `你是一名资深的测试策略师，专门负责：
                1. 设计完整的测试策略和测试计划
                2. 确定测试范围、测试类型和测试优先级
                3. 制定测试里程碑和验收标准
                4. 评估测试风险和制定风险缓解措施
                
                请提供结构化、可执行的测试策略建议。`
            },
            {
                id: 'tech_advisor',
                name: '技术选型师',
                avatar: '技',
                role: '技术选型师',
                expertise: ['测试工具', '自动化框架', '技术架构', '工具链'],
                description: '推荐合适的测试工具和技术栈，设计自动化测试架构',
                personality: '技术前沿，实用主义，注重工具和技术的适用性',
                priority: 3,
                isDefault: true,
                prompt: `你是一名技术选型专家，专门负责：
                1. 推荐最适合的测试工具和框架
                2. 设计自动化测试架构和工具链
                3. 评估技术方案的可行性和成本效益
                4. 提供技术实施建议和最佳实践
                
                请基于项目特点推荐具体、实用的技术方案。`
            },
            {
                id: 'risk_controller',
                name: '风险控制师',
                avatar: '险',
                role: '风险控制师',
                expertise: ['风险识别', '质量控制', '问题预防', '安全测试'],
                description: '识别测试过程中的各种风险和潜在问题，提出预防和控制措施',
                personality: '谨慎细心，预见性强，善于发现和预防问题',
                priority: 4,
                isDefault: true,
                prompt: `你是一名风险控制专家，专门负责：
                1. 识别项目和测试过程中的各种风险
                2. 评估风险的影响程度和发生概率
                3. 制定风险预防和控制措施
                4. 提供质量保证和安全测试建议
                
                请从风险防控角度提供专业建议。`
            },
            {
                id: 'case_researcher',
                name: '案例研究员',
                avatar: '例',
                role: '案例研究员',
                expertise: ['最佳实践', '行业案例', '经验总结', '标准规范'],
                description: '研究行业最佳实践和成功案例，为项目提供经验参考',
                personality: '博学深究，善于学习和总结，能够借鉴成功经验',
                priority: 5,
                isDefault: true,
                prompt: `你是一名案例研究专家，专门负责：
                1. 搜索和分析相关行业的最佳实践
                2. 提供成功案例和经验教训
                3. 对比不同解决方案的优劣
                4. 总结行业标准和规范要求
                
                请提供有价值的参考案例和实践建议。`
            },
            {
                id: 'cost_estimator',
                name: '成本评估师',
                avatar: '本',
                role: '成本评估师',
                expertise: ['成本估算', '资源规划', '预算控制', '效率优化'],
                description: '评估测试项目的成本和资源需求，优化资源配置',
                personality: '数据驱动，成本意识强，善于平衡质量和效率',
                priority: 6,
                isDefault: true,
                prompt: `你是一名成本评估专家，专门负责：
                1. 估算测试项目的人力、时间和工具成本
                2. 评估不同方案的成本效益比
                3. 提供资源优化和效率提升建议
                4. 制定预算控制和成本监控措施
                
                请提供详细的成本分析和资源规划建议。`
            },
            {
                id: 'solution_integrator',
                name: '方案整合师',
                avatar: '合',
                role: '方案整合师',
                expertise: ['方案整合', '文档编写', '流程设计', '团队协调'],
                description: '整合各专家的建议，输出完整的测试方案报告',
                personality: '统筹协调，文档能力强，善于整合和总结',
                priority: 7,
                isDefault: true,
                prompt: `你是一名方案整合专家，专门负责：
                1. 整合各位专家的建议和方案
                2. 编写完整、结构化的测试方案文档
                3. 协调不同观点，形成统一方案
                4. 确保方案的完整性和可执行性
                
                请提供清晰、完整的最终测试方案。`
            }
        ];
    },

    // 加载自定义专家
    loadCustomExperts() {
        const customExperts = JSON.parse(localStorage.getItem('aigent_custom_experts') || '[]');
        this.experts.push(...customExperts);
        console.log(`📚 加载了 ${customExperts.length} 个自定义专家`);
    },

    // 获取默认专家
    getDefaultExperts() {
        return this.experts.filter(expert => expert.isDefault);
    },

    // 获取自定义专家
    getCustomExperts() {
        return this.experts.filter(expert => !expert.isDefault);
    },

    // 获取所有专家
    getAllExperts() {
        return this.experts;
    },

    // 根据ID获取专家
    getExpertById(id) {
        return this.experts.find(expert => expert.id === id);
    },

    // 根据需求选择合适的专家
    selectExpertsForTask(requirement) {
        // 分析需求关键词
        const keywords = this.extractKeywords(requirement.toLowerCase());
        
        // 所有默认专家都会参与
        const selectedExperts = this.getDefaultExperts();
        
        // 根据关键词添加合适的自定义专家
        const customExperts = this.getCustomExperts();
        customExperts.forEach(expert => {
            const expertKeywords = expert.expertise.join(' ').toLowerCase();
            const hasMatch = keywords.some(keyword => expertKeywords.includes(keyword));
            if (hasMatch) {
                selectedExperts.push(expert);
            }
        });
        
        // 按优先级排序
        return selectedExperts.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    },

    // 提取关键词
    extractKeywords(text) {
        const commonKeywords = [
            'web', '网站', '前端', '后端', 'api', '接口',
            'mobile', '移动', '手机', 'app', '应用',
            'performance', '性能', '压力', '负载',
            'security', '安全', '漏洞', '防护',
            'automation', '自动化', '脚本', '工具',
            'ui', 'ux', '界面', '用户体验',
            'database', '数据库', '数据', '存储',
            'cloud', '云', '部署', '运维'
        ];
        
        return commonKeywords.filter(keyword => text.includes(keyword));
    },

    // 创建自定义专家
    createCustomExpert(expertData) {
        const expert = {
            id: `custom_${Date.now()}`,
            name: expertData.name,
            avatar: expertData.name.substring(0, 1),
            role: expertData.role,
            expertise: expertData.expertise || [],
            description: expertData.description,
            personality: expertData.personality || '',
            priority: expertData.priority || 999,
            isDefault: false,
            prompt: expertData.prompt || this.generateDefaultPrompt(expertData),
            createdAt: new Date().toISOString()
        };
        
        this.experts.push(expert);
        this.saveCustomExperts();
        
        console.log('👨‍💼 创建自定义专家:', expert.name);
        return expert;
    },

    // 生成默认提示词
    generateDefaultPrompt(expertData) {
        return `你是一名${expertData.role}，专门负责${expertData.description}。
        
专业领域：${expertData.expertise ? expertData.expertise.join('、') : '相关领域'}

请根据你的专业知识提供准确、实用的建议。`;
    },

    // 更新专家信息
    updateExpert(expertId, updates) {
        const expert = this.getExpertById(expertId);
        if (expert && !expert.isDefault) {
            Object.assign(expert, updates);
            this.saveCustomExperts();
            console.log('📝 更新专家信息:', expert.name);
            return expert;
        }
        return null;
    },

    // 删除自定义专家
    deleteExpert(expertId) {
        const index = this.experts.findIndex(expert => expert.id === expertId);
        if (index !== -1 && !this.experts[index].isDefault) {
            const expert = this.experts.splice(index, 1)[0];
            this.saveCustomExperts();
            console.log('🗑️ 删除专家:', expert.name);
            return true;
        }
        return false;
    },

    // 保存自定义专家到本地存储
    saveCustomExperts() {
        const customExperts = this.getCustomExperts();
        localStorage.setItem('aigent_custom_experts', JSON.stringify(customExperts));
    },

    // 生成专家协作计划
    generateCollaborationPlan(requirement, selectedExperts) {
        const plan = {
            phases: [
                {
                    name: '需求理解阶段',
                    experts: ['requirements_analyst'],
                    description: '深入理解和分析用户需求'
                },
                {
                    name: '策略制定阶段',
                    experts: ['test_strategist', 'risk_controller'],
                    description: '制定测试策略和风险控制方案'
                },
                {
                    name: '技术选型阶段',
                    experts: ['tech_advisor', 'case_researcher'],
                    description: '选择合适的技术方案和参考最佳实践'
                },
                {
                    name: '成本评估阶段',
                    experts: ['cost_estimator'],
                    description: '评估项目成本和资源需求'
                },
                {
                    name: '方案整合阶段',
                    experts: ['solution_integrator'],
                    description: '整合所有建议生成最终测试方案'
                }
            ],
            timeline: this.estimateTimeline(selectedExperts.length),
            coordination: {
                leadExpert: 'requirements_analyst',
                meetingPoints: ['需求确认', '策略评审', '方案整合'],
                deliverables: ['需求分析报告', '测试策略文档', '最终测试方案']
            }
        };
        
        return plan;
    },

    // 估算协作时间
    estimateTimeline(expertCount) {
        const baseTime = 5; // 基础5分钟
        const additionalTime = expertCount * 2; // 每个专家额外2分钟
        return Math.min(baseTime + additionalTime, 20); // 最多20分钟
    },

    // 获取专家思考提示
    getExpertThinkingPrompt(expert, context) {
        return `作为${expert.name}，请按照以下步骤思考：

1. **问题分析**: 从${expert.role}的角度分析当前问题
2. **专业评估**: 基于你的专业领域(${expert.expertise.join('、')})进行评估
3. **解决方案**: 提出具体的建议和解决方案
4. **风险考虑**: 识别可能的风险和注意事项
5. **协作建议**: 与其他专家的协作点

上下文信息：
${context}

请提供详细的思考过程和专业建议。`;
    },

    // 模拟专家思考过程
    generateThinking(expert, message, context) {
        return {
            analysis: `从${expert.role}角度分析：${message}`,
            solution: `基于${expert.expertise.join('、')}专业知识，建议...`,
            considerations: `需要考虑的因素包括...`,
            collaboration: `建议与其他专家协作的方面...`
        };
    },

    // 获取专家头像颜色
    getExpertAvatarColor(expertId) {
        const colors = [
            '#1890ff', '#52c41a', '#fa8c16', '#eb2f96',
            '#722ed1', '#13c2c2', '#f5222d', '#faad14'
        ];
        
        const index = this.experts.findIndex(expert => expert.id === expertId);
        return colors[index % colors.length];
    },

    // 检查专家状态
    getExpertStatus(expertId) {
        // 模拟专家在线状态
        return {
            online: true,
            busy: false,
            lastSeen: new Date(),
            workload: Math.floor(Math.random() * 3) + 1 // 1-3 工作负载
        };
    },

    // 获取专家统计信息
    getExpertStats() {
        return {
            total: this.experts.length,
            default: this.getDefaultExperts().length,
            custom: this.getCustomExperts().length,
            online: this.experts.filter(() => Math.random() > 0.1).length // 模拟在线状态
        };
    }
};

// 导出到全局
window.ExpertSystem = ExpertSystem;