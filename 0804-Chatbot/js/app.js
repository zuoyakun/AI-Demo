/**
 * AIGenTest - 主应用程序
 * 负责应用初始化、状态管理和核心功能协调
 */

// 全局应用状态管理
window.App = {
    // 应用状态
    state: {
        currentConversation: null,
        conversations: [],
        experts: [],
        messages: [],
        isInitialized: false,
        config: {
            apiKey: localStorage.getItem('aigent_api_key') || '',
            searchApiKey: localStorage.getItem('aigent_search_api_key') || '',
            searchEngineId: localStorage.getItem('aigent_search_engine_id') || ''
        }
    },

    // DOM元素引用
    elements: {},

    // 初始化应用
    init() {
        console.log('🚀 AIGenTest应用启动中...');
        
        // 初始化状态
        this.state = {
            isInitialized: false,
            isProcessing: false,
            conversations: [],
            currentConversation: null,
            experts: [],
            config: {
                apiKey: localStorage.getItem('aigent_api_key'),
                searchApiKey: localStorage.getItem('aigent_search_api_key'),
                searchEngineId: localStorage.getItem('aigent_search_engine_id')
            }
        };
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 初始化本地存储
        this.initializeStorage();
        
        // 加载本地存储的数据
        this.loadStoredData();
        
        // 初始化安全系统
        this.initializeSecuritySystem();
        
        // 初始化各个模块
        this.initializeModules();
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 检查配置状态
        this.checkConfiguration();
        
        // 标记为已初始化
        this.state.isInitialized = true;
        
        // 显示本地存储状态提示
        this.showStorageStatus();
        
        // 检查是否有分享链接参数
        this.checkShareLink();
        
        // 恢复当前会话的测试报告
        if (this.state.currentConversation) {
            this.restoreSessionReport(this.state.currentConversation.id);
        }
        
        console.log('✅ AIGenTest应用启动完成', this.state.config);
    },

    // 缓存DOM元素
    cacheElements() {
        this.elements = {
            // 侧边栏相关
            sidebar: document.getElementById('sidebar'),
            conversationList: document.getElementById('conversationList'),
            searchConversations: document.getElementById('searchConversations'),
            expertCount: document.getElementById('expertCount'),
            
            // 聊天区域相关
            chatHeader: document.getElementById('chatHeader'),
            currentProjectTitle: document.getElementById('currentProjectTitle'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            attachBtn: document.getElementById('attachBtn'),
            inputArea: document.getElementById('inputArea'),
            
            // 滚动相关
            scrollToTop: document.getElementById('scrollToTop'),
            scrollToBottom: document.getElementById('scrollToBottom'),
            scrollIndicator: document.getElementById('scrollIndicator'),
            indicatorThumb: document.getElementById('indicatorThumb'),
            newMessageIndicator: document.getElementById('newMessageIndicator'),
            newMessageCount: document.getElementById('newMessageCount'),
            keyboardHint: document.getElementById('keyboardHint'),
            
            // 按钮相关
            configBtn: document.getElementById('configBtn'),
            addProjectBtn: document.getElementById('addProjectBtn'),
            startFirstProject: document.getElementById('startFirstProject'),
            viewReportBtn: document.getElementById('viewReportBtn'),
            downloadReportBtn: document.getElementById('downloadReportBtn'),
            addExpertBtn: document.getElementById('addExpertBtn'),
            
            // 模态框相关
            configModal: document.getElementById('configModal'),
            closeConfigBtn: document.getElementById('closeConfigBtn'),
            thinkingModal: document.getElementById('thinkingModal'),
            closeThinkingBtn: document.getElementById('closeThinkingBtn'),
            
            // 报告面板相关
            reportPanel: document.getElementById('reportPanel'),
            closeReportBtn: document.getElementById('closeReportBtn'),
        backToChatBtn: document.getElementById('backToChatBtn'),
            reportContent: document.getElementById('reportContent'),
            chatOverlay: document.getElementById('chatOverlay'),
            floatingReportBtn: document.getElementById('floatingReportBtn'),
            
            // 其他
            loadingIndicator: document.getElementById('loadingIndicator')
        };
    },

    // 初始化各个模块
    initializeModules() {
        // 初始化专家系统
        if (window.ExpertSystem) {
            console.log('✅ ExpertSystem存在，开始初始化...');
            ExpertSystem.init();
            this.state.experts = ExpertSystem.getAllExperts();
            this.updateExpertCount();
            console.log('✅ ExpertSystem初始化完成，专家数量:', this.state.experts.length);
        } else {
            console.error('❌ ExpertSystem不存在，无法初始化');
        }

        // 初始化聊天系统
        if (window.ChatSystem) {
            ChatSystem.init();
        }

        // 初始化配置系统
        if (window.ConfigSystem) {
            ConfigSystem.init();
        }

        // 初始化报告系统
        if (window.ReportSystem) {
            ReportSystem.init();
        }

        // 初始化API系统
        if (window.APISystem) {
            APISystem.init();
        }

        // 初始化@专家和表情功能
        if (window.MentionEmojiSystem) {
            MentionEmojiSystem.init();
        }

        // 初始化滚动功能
        this.initializeScrollFeatures();
    },

    // 绑定事件监听器
    bindEvents() {
        // 发送消息
        this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // 输入框事件
        this.elements.messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 开始第一个项目
        this.elements.startFirstProject?.addEventListener('click', () => this.startNewProject());

        // 新建项目
        this.elements.addProjectBtn?.addEventListener('click', () => this.startNewProject());

        // 配置按钮
        this.elements.configBtn?.addEventListener('click', () => this.openConfig());
        this.elements.closeConfigBtn?.addEventListener('click', () => this.closeConfig());

        // 思考详情模态框
        this.elements.closeThinkingBtn?.addEventListener('click', () => this.closeThinkingModal());

        // 报告面板
        this.elements.viewReportBtn?.addEventListener('click', () => this.toggleReportPanel());
        this.elements.closeReportBtn?.addEventListener('click', () => this.closeReportPanel());
        this.elements.backToChatBtn?.addEventListener('click', () => this.closeReportPanel());
        this.elements.downloadReportBtn?.addEventListener('click', () => this.downloadReport());
        this.elements.chatOverlay?.addEventListener('click', () => this.closeReportPanel());
        this.elements.floatingReportBtn?.addEventListener('click', () => this.toggleReportPanel());

        // 搜索会话
        this.elements.searchConversations?.addEventListener('input', (e) => this.searchConversations(e.target.value));

        // 滚动相关事件
        this.elements.scrollToTop?.addEventListener('click', () => this.scrollToTop());
        this.elements.scrollToBottom?.addEventListener('click', () => this.scrollToBottom());
        this.elements.newMessageIndicator?.addEventListener('click', () => this.scrollToBottom());
        
        // 消息容器滚动事件
        this.elements.messagesContainer?.addEventListener('scroll', () => this.handleScroll());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        
        // 鼠标进入消息区域显示提示
        this.elements.messagesContainer?.addEventListener('mouseenter', () => this.showKeyboardHint());
        this.elements.messagesContainer?.addEventListener('mouseleave', () => this.hideKeyboardHint());

        // 模态框外部点击关闭
        this.elements.configModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.configModal) {
                this.closeConfig();
            }
        });

        // 页面卸载前保存数据
        window.addEventListener('beforeunload', () => {
            this.saveConversations();
            this.saveExperts();
            this.saveAppData();
        });

        this.elements.thinkingModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.thinkingModal) {
                this.closeThinkingModal();
            }
        });
    },

    // 检查配置状态
    checkConfiguration() {
        if (!this.state.config.apiKey) {
            this.showWelcomeMessage();
            // 添加配置提示
            setTimeout(() => {
                this.showNotification('欢迎使用AIGenTest！请先配置API密钥以启用AI专家功能。', 'info');
            }, 2000);
        }
    },

    // 显示欢迎信息
    showWelcomeMessage() {
        console.log('👋 显示欢迎信息');
        // 欢迎信息已在HTML中预设
        // 添加配置按钮高亮提示
        const configBtn = this.elements.configBtn;
        if (configBtn && !this.state.config.apiKey) {
            configBtn.classList.add('bounce');
            setTimeout(() => {
                configBtn.classList.remove('bounce');
            }, 3000);
        }
    },

    // 发送消息
    async sendMessage() {
        const input = this.elements.messageInput;
        const message = input.value.trim();
        
        if (!message) return;

        // 检查API配置
        if (!this.state.config.apiKey) {
            this.showNotification('请先在配置中设置API密钥', 'warning');
            this.openConfig();
            return;
        }

        // 清空输入框
        input.value = '';
        
        // 如果没有当前会话，创建新会话
        if (!this.state.currentConversation) {
            this.createNewConversation(message);
        }

        // 显示加载指示器
        this.showLoadingIndicator();

        try {
            // 调用AI专家团队处理消息
            await ChatSystem.processMessage(message, this.state.currentConversation.id);
        } catch (error) {
            console.error('❌ 处理消息时出错:', error);
            this.showNotification('处理消息时出错，请稍后重试', 'error');
        } finally {
            // 隐藏加载指示器
            this.hideLoadingIndicator();
        }
    },

    // 创建新会话
    createNewConversation(firstMessage) {
        const conversation = {
            id: Date.now().toString(),
            title: this.generateConversationTitle(firstMessage),
            timestamp: new Date(),
            messages: [],
            status: 'active',
            lastReadTime: new Date().toISOString() // 初始化最后已读时间
        };

        this.state.conversations.unshift(conversation);
        this.state.currentConversation = conversation;
        
        // 保存到本地存储
        this.saveConversations();
        this.saveAppData();
        
        // 更新UI
        this.updateConversationList();
        this.updateChatHeader();
        this.showChatControls();
        
        console.log('📝 创建新会话:', conversation.title);
    },

    // 生成会话标题
    generateConversationTitle(message) {
        // 简单的标题生成逻辑，取前20个字符
        let title = message.substring(0, 20);
        if (message.length > 20) {
            title += '...';
        }
        return title || '新的测试项目';
    },



    // 渲染消息
    renderMessage(message) {
        const messageElement = this.createMessageElement(message);
        this.elements.messagesContainer.appendChild(messageElement);
        
        // 添加淡入动画
        messageElement.classList.add('fade-in');
        
        // 如果是AI消息，更新浮动报告按钮状态
        if (message.type === 'ai' || message.type === 'assistant') {
            setTimeout(() => this.updateFloatingReportButton(), 100);
        }
    },

    // 创建消息元素
    createMessageElement(message) {
        const div = document.createElement('div');
        
        if (message.type === 'user') {
            div.className = 'flex justify-end';
            div.innerHTML = `
                <div class="max-w-md">
                    <div class="message-bubble-user text-white p-3 shadow-sm">
                        <p class="text-sm leading-relaxed">${this.escapeHtml(message.content)}</p>
                    </div>
                    <div class="text-xs text-gray-500 mt-1 text-right">
                        ${this.formatTime(message.timestamp)}
                    </div>
                </div>
            `;
        } else if (message.type === 'ai' || message.type === 'assistant') {
            div.className = 'flex justify-start';
            const expert = message.expert || { 
                name: message.name || 'AI助手', 
                avatar: message.avatar || 'AI' 
            };
            
            div.innerHTML = `
                <div class="flex space-x-3 max-w-2xl">
                    <div class="expert-avatar expert-online" title="${expert.name}">
                        ${expert.avatar === 'AI' ? 'AI' : `<i class="${expert.avatar}"></i>`}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="font-medium text-gray-800">${expert.name}</span>
                            ${message.thinking ? `<button class="text-xs text-blue-600 hover:text-blue-800 thinking-btn" data-thinking='${JSON.stringify(message.thinking)}'>
                                <i class="fas fa-brain mr-1"></i>查看思考
                            </button>` : ''}
                        </div>
                        <div class="message-bubble-ai p-3 shadow-sm">
                            <div class="text-sm leading-relaxed">${this.formatMessageContent(message.content)}</div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${this.formatTime(message.timestamp)}
                        </div>
                    </div>
                </div>
            `;
            
            // 绑定思考按钮事件
            const thinkingBtn = div.querySelector('.thinking-btn');
            if (thinkingBtn) {
                thinkingBtn.addEventListener('click', () => {
                    this.showThinkingDetails(message.thinking);
                });
            }
        } else if (message.type === 'system') {
            div.className = 'flex justify-center';
            div.innerHTML = `
                <div class="message-bubble-system px-4 py-2 text-sm text-gray-600">
                    ${this.escapeHtml(message.content)}
                </div>
            `;
        }
        
        return div;
    },

    // 格式化消息内容
    formatMessageContent(content) {
        // 首先高亮@专家提及
        let formattedContent = this.highlightMentions(content);
        
        // 使用统一的markdown处理逻辑
        if (window.ReportSystem && window.ReportSystem.formatMarkdownContent) {
            return window.ReportSystem.formatMarkdownContent(formattedContent);
        }
        
        // 回退到简化版本（如果ReportSystem不可用）
        return this.formatMarkdownContentFallback(formattedContent);
    },

    // 简化版markdown格式化（回退方案）
    formatMarkdownContentFallback(content) {
        // 预处理：清理多余的空行和统一换行符
        content = content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
        
        // 分行处理markdown
        const lines = content.split('\n');
        const processedLines = [];
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (!line) {
                // 空行处理
                if (inList) {
                    processedLines.push('</div>'); // 结束列表容器
                    inList = false;
                }
                processedLines.push('<div class="my-4"></div>');
                continue;
            }
            
            // 处理标题 - 统一层级和样式
            if (line.match(/^#{4,}\s/)) {
                // 四级及以上标题统一为四级
                const title = line.replace(/^#{4,}\s*/, '');
                line = `<h4 class="text-base font-semibold text-gray-800 mt-4 mb-2 flex items-center">
                    <span class="w-1 h-4 bg-blue-500 mr-2 flex-shrink-0"></span>${title}
                </h4>`;
                if (inList) {
                    processedLines.push('</div>');
                    inList = false;
                }
            } else if (line.match(/^#{3}\s/)) {
                const title = line.replace(/^#{3}\s*/, '');
                line = `<h3 class="text-lg font-bold text-blue-700 mt-6 mb-3 border-l-4 border-blue-500 pl-3">${title}</h3>`;
                if (inList) {
                    processedLines.push('</div>');
                    inList = false;
                }
            } else if (line.match(/^#{2}\s/)) {
                const title = line.replace(/^#{2}\s*/, '');
                line = `<h2 class="text-xl font-bold text-blue-800 mt-8 mb-4 border-b border-blue-300 pb-2">${title}</h2>`;
                if (inList) {
                    processedLines.push('</div>');
                    inList = false;
                }
            } else if (line.match(/^#{1}\s/)) {
                const title = line.replace(/^#{1}\s*/, '');
                line = `<h1 class="text-2xl font-bold text-blue-900 mt-8 mb-6 bg-blue-50 p-3 rounded">${title}</h1>`;
                if (inList) {
                    processedLines.push('</div>');
                    inList = false;
                }
            }
            // 处理列表项
            else if (line.match(/^-\s+/)) {
                const listContent = line.replace(/^-\s*/, '');
                const processedListContent = this.processInlineMarkdown(listContent);
                
                if (!inList) {
                    processedLines.push('<div class="space-y-2 ml-4">');
                    inList = true;
                }
                line = `<div class="flex items-start">
                    <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span class="flex-1 leading-relaxed">${processedListContent}</span>
                </div>`;
            }
            // 处理普通段落
            else {
                if (inList) {
                    processedLines.push('</div>');
                    inList = false;
                }
                
                const processedText = this.processInlineMarkdown(line);
                
                // 检查是否是分隔线
                if (line.match(/^-{3,}$/)) {
                    line = '<hr class="my-6 border-gray-300">';
                } else {
                    line = `<p class="mb-3 leading-relaxed text-gray-700">${processedText}</p>`;
                }
            }
            
            processedLines.push(line);
        }
        
        // 确保列表容器正确关闭
        if (inList) {
            processedLines.push('</div>');
        }
        
        return processedLines.join('');
    },

    // 处理行内markdown格式
    processInlineMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>');
    },

    // 高亮显示@专家提及
    highlightMentions(content) {
        if (!window.MentionEmojiSystem) {
            return content;
        }
        return window.MentionEmojiSystem.highlightMentions(content);
    },

    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 格式化时间
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) { // 小于1分钟
            return '刚刚';
        } else if (diff < 3600000) { // 小于1小时
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) { // 小于1天
            return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return time.toLocaleDateString('zh-CN');
        }
    },



    // 开始新项目
    startNewProject() {
        // 清空当前会话
        this.state.currentConversation = null;
        
        // 清空消息显示
        this.elements.messagesContainer.innerHTML = '';
        
        // 重置界面
        this.elements.currentProjectTitle.textContent = '新的测试项目';
        this.hideChatControls();
        
        // 隐藏浮动报告按钮
        this.elements.floatingReportBtn?.classList.add('hidden');
        
        // 聚焦输入框
        this.elements.messageInput.focus();
        
        console.log('🆕 开始新项目');
    },



    // 更新会话列表
    updateConversationList() {
        const container = this.elements.conversationList;
        container.innerHTML = '';
        
        // 添加项目统计头部
        if (this.state.conversations.length > 0) {
            const statsHeader = document.createElement('div');
            statsHeader.className = 'px-3 py-2 text-xs text-gray-500 border-b border-gray-200 bg-gray-50';
            statsHeader.innerHTML = `
                <div class="flex items-center justify-between">
                    <span><i class="fas fa-database mr-2"></i>历史项目</span>
                    <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">${this.state.conversations.length}</span>
                </div>
            `;
            container.appendChild(statsHeader);
        }
        
        this.state.conversations.forEach(conversation => {
            const item = this.createConversationItem(conversation);
            container.appendChild(item);
        });
    },

    // 创建会话列表项
    createConversationItem(conversation) {
        const div = document.createElement('div');
        const isActive = this.state.currentConversation?.id === conversation.id;
        
        // 检查是否有未读的AI消息
        const hasUnreadAI = this.hasUnreadAIMessages(conversation);
        
        div.className = `conversation-item p-3 cursor-pointer hover:bg-gray-50 transition-colors group ${isActive ? 'active' : ''}`;
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center relative">
                    <i class="fas fa-project-diagram text-blue-600"></i>
                    ${hasUnreadAI ? `
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full pulse-animation"></div>
                    ` : ''}
                </div>
                <div class="flex-1 min-w-0 conversation-content">
                    <div class="flex items-center">
                        <h4 class="font-medium truncate flex-1">${conversation.title}</h4>
                        ${hasUnreadAI ? `
                            <span class="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">新回复</span>
                        ` : ''}
                    </div>
                    <p class="text-sm text-gray-500 truncate">
                        ${conversation.messages.length} 条消息 · ${this.formatTime(conversation.timestamp)}
                    </p>
                </div>
                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="delete-conversation-btn p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            data-conversation-id="${conversation.id}"
                            title="删除项目">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        
        // 主要点击区域（不包括删除按钮）
        const contentArea = div.querySelector('.conversation-content');
        contentArea.addEventListener('click', () => {
            // 切换会话时，清除未读标记
            this.clearUnreadMessages(conversation.id);
            this.switchConversation(conversation);
        });
        
        // 删除按钮事件
        const deleteBtn = div.querySelector('.delete-conversation-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发会话切换
            this.deleteConversation(conversation.id);
        });
        
        return div;
    },

    // 检查是否有未读的AI消息
    hasUnreadAIMessages(conversation) {
        if (!conversation.messages || conversation.id === this.state.currentConversation?.id) {
            return false; // 当前会话或无消息，不显示未读标记
        }

        // 获取会话的最后已读时间（向下兼容旧会话）
        let lastReadTime;
        if (conversation.lastReadTime) {
            lastReadTime = new Date(conversation.lastReadTime);
        } else {
            // 如果没有lastReadTime，使用会话创建时间作为默认值
            lastReadTime = new Date(conversation.timestamp || 0);
        }
        
        // 查找最后已读时间之后的AI/助手消息
        const unreadAIMessages = conversation.messages.filter(message => {
            if (message.type !== 'ai' && message.type !== 'assistant') {
                return false;
            }
            
            const messageTime = new Date(message.timestamp);
            return messageTime > lastReadTime;
        });

        return unreadAIMessages.length > 0;
    },

    // 清除未读消息标记
    clearUnreadMessages(conversationId) {
        const conversation = this.state.conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            // 更新最后已读时间为当前时间
            conversation.lastReadTime = new Date().toISOString();
            
            // 保存到本地存储
            this.saveConversations();
            
            console.log('📖 已清除会话未读标记:', conversationId);
            
            // 更新会话列表显示
            this.updateConversationList();
        }
    },

    // 删除会话
    deleteConversation(conversationId) {
        const conversation = this.state.conversations.find(conv => conv.id === conversationId);
        if (!conversation) {
            console.warn('要删除的会话未找到:', conversationId);
            return;
        }

        // 确认删除
        const confirmMessage = `确定要删除项目 "${conversation.title}" 吗？\n\n此操作将永久删除该项目的所有对话记录，无法恢复。`;
        if (!confirm(confirmMessage)) {
            return;
        }

        console.log('🗑️ 删除项目:', conversation.title);

        // 从状态中删除会话
        this.state.conversations = this.state.conversations.filter(conv => conv.id !== conversationId);

        // 同时删除相关的测试报告
        if (window.ReportSystem && window.ReportSystem.deleteReportFromStorage) {
            window.ReportSystem.deleteReportFromStorage(conversationId);
        }

        // 如果删除的是当前活跃会话，需要处理状态切换
        if (this.state.currentConversation?.id === conversationId) {
            // 清空当前会话状态
            this.state.currentConversation = null;
            this.state.messages = [];

            // 清空聊天界面
            this.clearChatInterface();

            // 如果还有其他会话，切换到最新的一个
            if (this.state.conversations.length > 0) {
                const latestConversation = this.state.conversations[0];
                this.switchConversation(latestConversation);
            } else {
                // 没有其他会话，显示欢迎界面
                this.showWelcomeMessage();
            }
        }

        // 保存到本地存储
        this.saveConversations();
        this.saveAppData();

        // 更新UI
        this.updateConversationList();
        this.updateChatHeader();

        // 显示删除成功提示
        this.showNotification(`项目 "${conversation.title}" 已删除`, 'success');

        console.log('✅ 项目删除完成');
    },

    // 清空聊天界面
    clearChatInterface() {
        const messagesContainer = this.elements.messagesContainer;
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        // 重置滚动状态
        if (this.scrollState) {
            this.scrollState.isAtBottom = true;
            this.scrollState.newMessageCount = 0;
            this.updateScrollIndicator();
            this.updateScrollButtons();
            this.updateNewMessageIndicator();
        }
    },

    // 显示欢迎消息
    showWelcomeMessage() {
        const messagesContainer = this.elements.messagesContainer;
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center p-8">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-comments text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-800 mb-2">欢迎使用 AIGenTest</h3>
                        <p class="text-gray-600 mb-4">开始您的智能测试方案协作之旅</p>
                        <button class="px-6 py-2 btn-enterprise text-white rounded-lg hover:shadow-lg transition-all" 
                                onclick="window.App.startNewProject()">
                            <i class="fas fa-plus mr-2"></i>创建新项目
                        </button>
                    </div>
                </div>
            `;
        }

        // 隐藏聊天控件
        this.hideChatControls();
    },

    // 隐藏聊天控件
    hideChatControls() {
        const chatControls = document.querySelector('.chat-controls');
        if (chatControls) {
            chatControls.style.display = 'none';
        }
    },

    // 显示聊天控件
    showChatControls() {
        const chatControls = document.querySelector('.chat-controls');
        if (chatControls) {
            chatControls.style.display = 'flex';
        }
    },

    // 切换会话
    switchConversation(conversation) {
        // 不停止后台处理，允许AI在后台继续工作
        console.log('🔄 切换到会话:', conversation.title);
        if (window.ChatSystem && window.ChatSystem.state.isProcessing) {
            console.log('📡 后台仍有AI处理进行中，将继续在原项目中完成');
        }
        
        // 清除未读消息标记
        this.clearUnreadMessages(conversation.id);
        
        this.state.currentConversation = conversation;
        
        // 更新UI
        this.updateConversationList();
        this.updateChatHeader();
        this.renderConversationMessages();
        this.showChatControls();
        
        // 恢复该会话的测试报告
        this.restoreSessionReport(conversation.id);
        
        // 更新浮动报告按钮状态
        setTimeout(() => this.updateFloatingReportButton(), 200);
    },

    // 恢复会话的测试报告
    restoreSessionReport(conversationId) {
        if (window.ReportSystem) {
            const report = window.ReportSystem.loadReportFromStorage(conversationId);
            if (report) {
                // 恢复报告状态
                window.ReportSystem.state.currentReport = report;
                window.ReportSystem.state.hasTestContent = true;
                window.ReportSystem.renderReport(report);
                console.log('📋 已恢复会话报告:', conversationId);
            } else {
                // 检查当前会话是否包含测试内容
                const currentConversation = this.state.conversations.find(conv => conv.id === conversationId);
                if (currentConversation && window.ReportSystem.hasTestRelatedContent(currentConversation)) {
                    // 如果包含测试内容但没有保存的报告，重新生成
                    console.log('📋 检测到测试内容，重新生成报告...');
                    window.ReportSystem.state.hasTestContent = true;
                    window.ReportSystem.generateReport(currentConversation);
                } else {
                    // 清空当前报告显示
                    window.ReportSystem.state.currentReport = null;
                    window.ReportSystem.state.hasTestContent = false;
                    if (window.ReportSystem.renderEmptyReport) {
                        window.ReportSystem.renderEmptyReport();
                    }
                    console.log('📋 该会话暂无测试内容');
                }
            }
        }
    },

    // 渲染会话消息
    renderConversationMessages() {
        const container = this.elements.messagesContainer;
        container.innerHTML = '';
        
        if (this.state.currentConversation) {
            this.state.currentConversation.messages.forEach(message => {
                this.renderMessage(message);
            });
            this.scrollToBottom();
        }
    },

    // 更新聊天头部
    updateChatHeader() {
        if (this.state.currentConversation) {
            this.elements.currentProjectTitle.textContent = this.state.currentConversation.title;
        }
    },

    // 显示聊天控制按钮
    showChatControls() {
        this.elements.viewReportBtn?.classList.remove('hidden');
        this.elements.downloadReportBtn?.classList.remove('hidden');
    },

    // 隐藏聊天控制按钮
    hideChatControls() {
        this.elements.viewReportBtn?.classList.add('hidden');
        this.elements.downloadReportBtn?.classList.add('hidden');
    },

    // 下载报告
    downloadReport() {
        try {
            if (!window.ReportSystem) {
                this.showNotification('报告系统未初始化', 'error');
                return;
            }

            // 检查是否有报告可以下载
            if (!window.ReportSystem.state?.currentReport) {
                this.showNotification('请先生成测试报告', 'warning');
                this.toggleReportPanel(); // 打开报告面板，引导用户生成报告
                return;
            }

            // 显示下载选项
            this.showDownloadOptions();

        } catch (error) {
            console.error('❌ 下载报告失败:', error);
            this.showNotification('下载报告失败，请稍后重试', 'error');
        }
    },

    // 显示下载选项
    showDownloadOptions() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-download text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">下载测试方案</h3>
                    <p class="text-gray-600">选择您要下载的格式</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <button id="downloadPDF" class="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                        <i class="fas fa-file-pdf mr-2"></i>
                        下载为 PDF
                    </button>
                    <button id="downloadWord" class="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <i class="fas fa-file-word mr-2"></i>
                        下载为 Word
                    </button>
                </div>
                
                <button id="cancelDownload" class="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all">
                    取消
                </button>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定事件
        modal.querySelector('#downloadPDF').addEventListener('click', () => {
            window.ReportSystem.exportToPDF();
            document.body.removeChild(modal);
            this.showNotification('正在生成PDF，请稍后...', 'info');
        });

        modal.querySelector('#downloadWord').addEventListener('click', () => {
            window.ReportSystem.exportToWord();
            document.body.removeChild(modal);
            this.showNotification('正在生成Word文档，请稍后...', 'info');
        });

        modal.querySelector('#cancelDownload').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    },

    // 更新专家数量
    updateExpertCount() {
        if (this.elements.expertCount) {
            this.elements.expertCount.textContent = this.state.experts.length;
        }
    },

    // 搜索会话
    searchConversations(query) {
        const items = this.elements.conversationList.querySelectorAll('.conversation-item');
        
        items.forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const matches = title.includes(query.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    },

    // 显示加载指示器
    showLoadingIndicator() {
        this.elements.loadingIndicator?.classList.remove('hidden');
    },

    // 隐藏加载指示器
    hideLoadingIndicator() {
        this.elements.loadingIndicator?.classList.add('hidden');
    },

    // 显示思考详情
    showThinkingDetails(thinking) {
        const modal = this.elements.thinkingModal;
        const content = document.getElementById('thinkingContent');
        
        content.innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-bold text-blue-800 mb-2">
                        <i class="fas fa-search mr-2"></i>问题分析
                    </h4>
                    <p class="text-blue-700">${thinking.analysis || '正在分析用户需求...'}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-bold text-green-800 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>解决方案
                    </h4>
                    <p class="text-green-700">${thinking.solution || '正在制定解决方案...'}</p>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <h4 class="font-bold text-yellow-800 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>考虑因素
                    </h4>
                    <p class="text-yellow-700">${thinking.considerations || '正在评估相关因素...'}</p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    // 关闭思考详情模态框
    closeThinkingModal() {
        const modal = this.elements.thinkingModal;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    // 打开配置
    openConfig() {
        if (window.ConfigSystem) {
            ConfigSystem.show();
        }
    },

    // 关闭配置
    closeConfig() {
        if (window.ConfigSystem) {
            ConfigSystem.hide();
        }
    },

    // 切换报告面板
    toggleReportPanel() {
        const panel = this.elements.reportPanel;
        const overlay = this.elements.chatOverlay;
        const floatingBtn = this.elements.floatingReportBtn;
        
        panel.classList.toggle('show');
        overlay?.classList.toggle('show');
        
        // 隐藏浮动按钮当报告面板打开时
        if (panel.classList.contains('show')) {
            floatingBtn?.classList.add('hidden');
            if (window.ReportSystem) {
                ReportSystem.generateReport(this.state.currentConversation);
            }
        } else {
            // 如果有测试内容，显示浮动按钮
            if (this.hasTestContent()) {
                floatingBtn?.classList.remove('hidden');
            }
        }
    },

    // 关闭报告面板
    closeReportPanel() {
        this.elements.reportPanel?.classList.remove('show');
        this.elements.chatOverlay?.classList.remove('show');
        
        // 显示浮动按钮（如果有测试内容）
        if (this.hasTestContent()) {
            this.elements.floatingReportBtn?.classList.remove('hidden');
        }
        
        // 清除任何可能残留的导航元素
        const oldNavElements = document.querySelectorAll('.fixed.top-20.right-4, .doubao-navigation-corner');
        oldNavElements.forEach(nav => {
            nav.remove();
        });
    },

    // 检查当前对话是否包含测试内容
    hasTestContent() {
        if (!this.state.currentConversation || !this.state.currentConversation.messages) {
            return false;
        }
        
        // 检查是否有AI消息且包含测试相关内容
        const aiMessages = this.state.currentConversation.messages.filter(msg => msg.type === 'ai');
        if (aiMessages.length === 0) {
            return false;
        }
        
        // 使用报告系统的判断逻辑
        if (window.ReportSystem && typeof window.ReportSystem.shouldGenerateReport === 'function') {
            return window.ReportSystem.shouldGenerateReport(this.state.currentConversation);
        }
        
        // 简单的兜底判断
        const allText = this.state.currentConversation.messages.map(msg => msg.content).join(' ');
        const testKeywords = ['测试', '检测', '验证', '测试方案', '测试计划', '测试策略', '功能测试', '性能测试'];
        return testKeywords.some(keyword => allText.includes(keyword));
    },

    // 更新浮动按钮状态
    updateFloatingReportButton() {
        const floatingBtn = this.elements.floatingReportBtn;
        const reportPanel = this.elements.reportPanel;
        
        if (!floatingBtn) return;
        
        // 如果报告面板已开启，隐藏浮动按钮
        if (reportPanel?.classList.contains('show')) {
            floatingBtn.classList.add('hidden');
            return;
        }
        
        // 根据是否有测试内容显示/隐藏浮动按钮
        if (this.hasTestContent()) {
            floatingBtn.classList.remove('hidden');
        } else {
            floatingBtn.classList.add('hidden');
        }
    },

    // ==================== 本地存储功能 ====================

    // 初始化本地存储
    initializeStorage() {
        console.log('💾 初始化本地存储系统...');
        
        // 存储键名配置
        this.storageKeys = {
            conversations: 'aigent_conversations',
            experts: 'aigent_experts',
            userPreferences: 'aigent_user_preferences',
            appData: 'aigent_app_data'
        };
        
        console.log('✅ 本地存储系统初始化完成');
    },

    // 初始化安全系统
    initializeSecuritySystem() {
        console.log('🛡️ 初始化安全防护系统...');
        
        try {
            if (window.SecuritySystem) {
                window.SecuritySystem.init();
                console.log('✅ 安全防护系统初始化完成');
            } else {
                console.warn('⚠️ 安全系统未加载，将使用基础防护');
            }
        } catch (error) {
            console.error('❌ 安全系统初始化失败:', error);
            this.showNotification('安全系统初始化失败，建议刷新页面', 'warning');
        }
    },

    // 加载本地存储的数据
    loadStoredData() {
        console.log('📥 加载本地存储数据...');
        
        try {
            // 加载会话记录
            this.loadConversations();
            
            // 加载专家记录
            this.loadExperts();
            
            // 加载用户偏好
            this.loadUserPreferences();
            
            // 加载应用数据
            this.loadAppData();
            
            console.log('✅ 本地数据加载完成');
            
        } catch (error) {
            console.error('❌ 加载本地数据失败:', error);
            this.showNotification('加载历史数据时出现问题，将使用默认设置', 'warning');
        }
    },

    // 加载会话记录
    loadConversations() {
        const stored = localStorage.getItem(this.storageKeys.conversations);
        if (stored) {
            try {
                const conversations = JSON.parse(stored);
                this.state.conversations = conversations || [];
                console.log(`📋 已加载 ${conversations.length} 个历史会话`);
                
                // 更新UI
                this.updateConversationList();
            } catch (error) {
                console.error('❌ 解析会话数据失败:', error);
                this.state.conversations = [];
            }
        }
    },

    // 加载专家记录
    loadExperts() {
        const stored = localStorage.getItem(this.storageKeys.experts);
        if (stored) {
            try {
                const experts = JSON.parse(stored);
                this.state.experts = experts || [];
                console.log(`👥 已加载 ${experts.length} 个自定义专家`);
            } catch (error) {
                console.error('❌ 解析专家数据失败:', error);
                this.state.experts = [];
            }
        }
    },

    // 加载用户偏好
    loadUserPreferences() {
        const stored = localStorage.getItem(this.storageKeys.userPreferences);
        if (stored) {
            try {
                const preferences = JSON.parse(stored);
                // 应用用户偏好设置
                if (preferences.theme) {
                    document.body.className = preferences.theme;
                }
                console.log('🎨 已加载用户偏好设置');
            } catch (error) {
                console.error('❌ 解析用户偏好失败:', error);
            }
        }
    },

    // 加载应用数据
    loadAppData() {
        const stored = localStorage.getItem(this.storageKeys.appData);
        if (stored) {
            try {
                const appData = JSON.parse(stored);
                // 恢复应用状态
                if (appData.lastActiveConversation) {
                    // 可以考虑恢复最后活跃的会话
                }
                
                // 恢复API配置
                if (appData.config) {
                    this.state.config = {
                        ...this.state.config,
                        ...appData.config
                    };
                    console.log('🔑 已恢复API配置:', this.state.config);
                }
                
                console.log('📊 已加载应用数据');
            } catch (error) {
                console.error('❌ 解析应用数据失败:', error);
            }
        }
    },

    // 保存会话记录
    saveConversations() {
        try {
            const conversations = this.state.conversations.map(conv => ({
                ...conv,
                // 只保存必要的数据，减少存储空间
                messages: conv.messages?.slice(-50) || [] // 只保留最近50条消息
            }));
            
            localStorage.setItem(this.storageKeys.conversations, JSON.stringify(conversations));
            console.log(`💾 已保存 ${conversations.length} 个会话到本地存储`);
        } catch (error) {
            console.error('❌ 保存会话失败:', error);
            
            // 如果存储空间不足，尝试清理旧数据
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldData();
                this.showNotification('存储空间不足，已清理部分旧数据', 'warning');
            }
        }
    },

    // 保存专家记录
    saveExperts() {
        try {
            localStorage.setItem(this.storageKeys.experts, JSON.stringify(this.state.experts));
            console.log(`👥 已保存 ${this.state.experts.length} 个专家到本地存储`);
        } catch (error) {
            console.error('❌ 保存专家失败:', error);
        }
    },

    // 保存用户偏好
    saveUserPreferences(preferences) {
        try {
            localStorage.setItem(this.storageKeys.userPreferences, JSON.stringify(preferences));
            console.log('🎨 已保存用户偏好');
        } catch (error) {
            console.error('❌ 保存用户偏好失败:', error);
        }
    },

    // 保存应用数据
    saveAppData(data) {
        try {
            const appData = {
                lastActiveConversation: this.state.currentConversation?.id,
                lastSaveTime: new Date().toISOString(),
                version: '1.0',
                config: this.state.config,  // 保存API配置
                ...data
            };
            localStorage.setItem(this.storageKeys.appData, JSON.stringify(appData));
            console.log('📊 已保存应用数据', appData);
        } catch (error) {
            console.error('❌ 保存应用数据失败:', error);
        }
    },

    // 清理旧数据（默认30天）
    cleanupOldData() {
        return this.cleanupOldDataByDays(30);
    },

    // 按指定天数清理旧数据
    cleanupOldDataByDays(days) {
        console.log(`🧹 开始清理 ${days} 天前的旧数据...`);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const originalCount = this.state.conversations.length;
        
        // 过滤掉指定天数前的会话
        this.state.conversations = this.state.conversations.filter(conv => {
            return new Date(conv.timestamp) > cutoffDate;
        });
        
        const deletedCount = originalCount - this.state.conversations.length;
        
        // 如果当前会话被删除了，需要处理
        if (this.state.currentConversation && 
            !this.state.conversations.find(conv => conv.id === this.state.currentConversation.id)) {
            
            this.state.currentConversation = null;
            this.state.messages = [];
            this.clearChatInterface();
            
            if (this.state.conversations.length > 0) {
                this.switchConversation(this.state.conversations[0]);
            } else {
                this.showWelcomeMessage();
            }
        }
        
        // 重新保存清理后的数据
        this.saveConversations();
        this.saveAppData();
        
        // 更新UI
        this.updateConversationList();
        this.updateChatHeader();
        
        console.log(`✅ 清理完成，删除了 ${deletedCount} 个项目`);
        return deletedCount;
    },

    // 根据ID切换到指定项目
    switchToProject(projectId) {
        const conversation = this.state.conversations.find(conv => conv.id === projectId);
        if (conversation) {
            this.switchConversation(conversation);
            console.log('🔄 切换到项目:', conversation.title);
        } else {
            console.warn('要切换的项目未找到:', projectId);
            this.showNotification('项目未找到', 'error');
        }
    },

    // 导出所有数据
    exportAllData() {
        const exportData = {
            conversations: this.state.conversations,
            experts: this.state.experts,
            config: this.state.config,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `AIGenTest_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('数据导出成功', 'success');
        console.log('📦 数据导出完成');
    },

    // 导入数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!importData.version || !importData.conversations) {
                    throw new Error('无效的数据格式');
                }
                
                // 合并数据（避免覆盖）
                const existingIds = new Set(this.state.conversations.map(c => c.id));
                const newConversations = importData.conversations.filter(c => !existingIds.has(c.id));
                
                this.state.conversations = [...this.state.conversations, ...newConversations];
                this.state.experts = [...this.state.experts, ...(importData.experts || [])];
                
                // 保存到本地存储
                this.saveConversations();
                this.saveExperts();
                
                // 更新UI
                this.updateConversationList();
                
                this.showNotification(`成功导入 ${newConversations.length} 个会话`, 'success');
                console.log('📥 数据导入完成');
                
            } catch (error) {
                console.error('❌ 数据导入失败:', error);
                this.showNotification('数据导入失败，请检查文件格式', 'error');
            }
        };
        
        reader.readAsText(file);
    },

    // 显示存储状态
    showStorageStatus() {
        const conversations = this.state.conversations.length;
        if (conversations > 0) {
            this.showNotification(`✅ 本地记忆功能已激活！已恢复 ${conversations} 个历史项目`, 'success');
        } else {
            this.showNotification('💾 本地记忆功能已启用，您的项目记录将自动保存', 'info');
        }
    },

    // 检查分享链接
    checkShareLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            console.log('🔗 检测到分享链接，ID:', shareId);
            this.loadSharedReport(shareId);
        }
    },

    // 加载分享的报告
    loadSharedReport(shareId) {
        try {
            const shareKey = `aigent_share_${shareId}`;
            const shareDataString = localStorage.getItem(shareKey);
            
            if (!shareDataString) {
                this.showNotification('分享链接已过期或无效', 'warning');
                return;
            }
            
            const shareData = JSON.parse(shareDataString);
            
            // 显示分享报告提示
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 p-6">
                    <div class="text-center">
                        <div class="text-blue-600 text-5xl mb-4">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">发现分享的测试报告</h3>
                        <div class="text-left bg-gray-50 p-4 rounded-lg mb-4">
                            <p class="text-sm text-gray-600 mb-1"><strong>报告标题：</strong>${shareData.title}</p>
                            <p class="text-sm text-gray-600 mb-1"><strong>生成时间：</strong>${new Date(shareData.timestamp).toLocaleString()}</p>
                            <p class="text-sm text-gray-600"><strong>摘要：</strong>${shareData.summary}</p>
                        </div>
                        <p class="text-gray-600 mb-4">是否要查看这个分享的测试方案报告？</p>
                        <div class="flex space-x-3">
                            <button id="viewSharedReport" 
                                    class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                查看报告
                            </button>
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove(); history.replaceState({}, document.title, window.location.pathname)" 
                                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                                忽略
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 绑定查看报告事件
            modal.querySelector('#viewSharedReport').addEventListener('click', () => {
                this.displaySharedReport(shareData.report);
                modal.remove();
                // 清理URL参数
                history.replaceState({}, document.title, window.location.pathname);
            });
            
        } catch (error) {
            console.error('❌ 加载分享报告失败:', error);
            this.showNotification('加载分享报告失败', 'error');
        }
    },

    // 显示分享的报告
    displaySharedReport(report) {
        if (window.ReportSystem) {
            // 设置报告数据
            window.ReportSystem.state.currentReport = report;
            
            // 切换到报告标签
            const reportTab = document.querySelector('[data-tab="report"]');
            if (reportTab) {
                reportTab.click();
            }
            
            // 渲染报告内容
            window.ReportSystem.renderReport();
            
            this.showNotification('已加载分享的测试报告', 'success');
        } else {
            this.showNotification('报告系统未初始化', 'error');
        }
    },

    // 显示通知
    showNotification(message, type = 'info') {
        // 简单的通知实现
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // 获取当前配置
    getConfig() {
        return { ...this.state.config };
    },

    // 更新配置
    updateConfig(newConfig) {
        this.state.config = { ...this.state.config, ...newConfig };
        
        // 保存到localStorage
        Object.keys(newConfig).forEach(key => {
            if (key.includes('api') || key.includes('search')) {
                localStorage.setItem(`aigent_${key.toLowerCase().replace(/([A-Z])/g, '_$1')}`, newConfig[key]);
            }
        });
        
        // 保存到应用数据
        this.saveAppData({ config: this.state.config });
        
        // 重新初始化API系统
        if (window.APISystem) {
            window.APISystem.init();
        }
        
        console.log('🔧 配置已更新:', this.state.config);
    },

    // ==================== 滚动功能相关方法 ====================

    // 初始化滚动功能
    initializeScrollFeatures() {
        this.scrollState = {
            isUserScrolling: false,
            newMessageCount: 0,
            lastScrollTop: 0,
            isAtBottom: true
        };

        // 初始化滚动指示器
        this.updateScrollIndicator();
        
        // 调试：检查容器尺寸
        this.debugContainerSizes();
        
        console.log('📜 滚动功能初始化完成');
    },

    // 调试容器尺寸
    debugContainerSizes() {
        setTimeout(() => {
            const container = this.elements.messagesContainer;
            const wrapper = document.querySelector('.messages-wrapper');
            const parentContainer = document.querySelector('.flex-1.flex.min-h-0');
            
            if (container) {
                console.log('🔍 调试信息:');
                console.log('messagesContainer尺寸:', {
                    width: container.offsetWidth,
                    height: container.offsetHeight,
                    scrollHeight: container.scrollHeight,
                    clientHeight: container.clientHeight
                });
                
                if (wrapper) {
                    console.log('messages-wrapper尺寸:', {
                        width: wrapper.offsetWidth,
                        height: wrapper.offsetHeight
                    });
                }
                
                if (parentContainer) {
                    console.log('父容器尺寸:', {
                        width: parentContainer.offsetWidth,
                        height: parentContainer.offsetHeight
                    });
                }
                
                // 检查CSS样式
                const computedStyle = window.getComputedStyle(container);
                console.log('CSS样式:', {
                    overflow: computedStyle.overflow,
                    overflowY: computedStyle.overflowY,
                    height: computedStyle.height,
                    maxHeight: computedStyle.maxHeight
                });
            }
        }, 1000);
    },

    // 处理滚动事件
    handleScroll() {
        const container = this.elements.messagesContainer;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        
        // 更新滚动状态
        this.scrollState.lastScrollTop = scrollTop;
        this.scrollState.isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
        
        // 更新滚动指示器
        this.updateScrollIndicator();
        
        // 更新滚动按钮显示
        this.updateScrollButtons();
        
        // 处理新消息指示器
        this.updateNewMessageIndicator();
        
        // 节流处理
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = setTimeout(() => {
            this.scrollState.isUserScrolling = false;
        }, 150);
        
        this.scrollState.isUserScrolling = true;
    },

    // 更新滚动指示器
    updateScrollIndicator() {
        const container = this.elements.messagesContainer;
        const indicator = this.elements.scrollIndicator;
        const thumb = this.elements.indicatorThumb;
        
        if (!container || !indicator || !thumb) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        
        // 显示/隐藏指示器
        if (scrollHeight > clientHeight) {
            indicator.classList.add('show');
            
            // 计算拇指位置和大小
            const thumbHeight = Math.max((clientHeight / scrollHeight) * 60, 10);
            const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (60 - thumbHeight);
            
            thumb.style.height = `${thumbHeight}px`;
            thumb.style.top = `${thumbTop}px`;
        } else {
            indicator.classList.remove('show');
        }
    },

    // 更新滚动按钮
    updateScrollButtons() {
        const container = this.elements.messagesContainer;
        const topBtn = this.elements.scrollToTop;
        const bottomBtn = this.elements.scrollToBottom;
        
        if (!container || !topBtn || !bottomBtn) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        
        // 显示/隐藏回到顶部按钮
        if (scrollTop > 300) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
        
        // 显示/隐藏滚动到底部按钮
        if (scrollTop + clientHeight < scrollHeight - 300) {
            bottomBtn.classList.add('show');
        } else {
            bottomBtn.classList.remove('show');
        }
    },

    // 更新新消息指示器
    updateNewMessageIndicator() {
        const indicator = this.elements.newMessageIndicator;
        const countElement = this.elements.newMessageCount;
        
        if (!indicator || !countElement) return;

        // 如果用户不在底部且有新消息，显示指示器
        if (!this.scrollState.isAtBottom && this.scrollState.newMessageCount > 0) {
            indicator.classList.add('show');
            countElement.textContent = this.scrollState.newMessageCount;
        } else {
            indicator.classList.remove('show');
            this.scrollState.newMessageCount = 0;
        }
    },

    // 滚动到顶部
    scrollToTop() {
        const container = this.elements.messagesContainer;
        if (!container) return;

        container.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        console.log('⬆️ 滚动到顶部');
    },

    // 滚动到底部（增强版）
    scrollToBottom() {
        const container = this.elements.messagesContainer;
        if (!container) return;

        // 平滑滚动到底部
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        
        if (Math.abs(container.scrollTop - targetScrollTop) > 5) {
            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
        
        // 重置新消息计数
        this.scrollState.newMessageCount = 0;
        this.updateNewMessageIndicator();
        
        console.log('⬇️ 滚动到底部');
    },

    // 键盘导航
    handleKeyboardNavigation(e) {
        // 检查是否在输入框中
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // 处理Escape键关闭模态框和面板
        if (e.key === 'Escape') {
            if (this.elements.reportPanel?.classList.contains('show')) {
                this.closeReportPanel();
                return;
            }
            if (this.elements.configModal?.classList.contains('flex')) {
                this.closeConfig();
                return;
            }
        }

        // 只在聊天区域焦点时处理滚动
        const container = this.elements.messagesContainer;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        
        switch (e.key) {
            case 'Home':
                e.preventDefault();
                this.scrollToTop();
                break;
                
            case 'End':
                e.preventDefault();
                this.scrollToBottom();
                break;
                
            case 'PageUp':
                e.preventDefault();
                container.scrollBy({
                    top: -clientHeight * 0.8,
                    behavior: 'smooth'
                });
                break;
                
            case 'PageDown':
                e.preventDefault();
                container.scrollBy({
                    top: clientHeight * 0.8,
                    behavior: 'smooth'
                });
                break;
                
            case 'ArrowUp':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    container.scrollBy({
                        top: -50,
                        behavior: 'smooth'
                    });
                }
                break;
                
            case 'ArrowDown':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    container.scrollBy({
                        top: 50,
                        behavior: 'smooth'
                    });
                }
                break;
        }
    },

    // 显示键盘提示
    showKeyboardHint() {
        const hint = this.elements.keyboardHint;
        if (hint && !this.keyboardHintTimeout) {
            this.keyboardHintTimeout = setTimeout(() => {
                hint.classList.add('show');
            }, 1000);
        }
    },

    // 隐藏键盘提示
    hideKeyboardHint() {
        const hint = this.elements.keyboardHint;
        if (hint) {
            hint.classList.remove('show');
            if (this.keyboardHintTimeout) {
                clearTimeout(this.keyboardHintTimeout);
                this.keyboardHintTimeout = null;
            }
        }
    },

    // 重写添加消息方法以支持滚动功能
    addMessage(type, content, options = {}) {
        const message = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: type,
            content: content,
            timestamp: new Date(),
            ...options
        };
        
        // 添加到当前会话
        if (this.state.currentConversation) {
            if (!this.state.currentConversation.messages) {
                this.state.currentConversation.messages = [];
            }
            this.state.currentConversation.messages.push(message);
        }
        
        // 检查用户是否在底部
        const wasAtBottom = this.scrollState?.isAtBottom ?? true;
        
        // 更新UI
        this.renderMessage(message);
        
        // 滚动处理
        if (wasAtBottom || message.type === 'user') {
            // 如果用户在底部或者是用户消息，自动滚动到底部
            setTimeout(() => this.scrollToBottom(), 100);
        } else {
            // 否则增加新消息计数
            if (message.type === 'ai' || message.type === 'assistant') {
                if (this.scrollState) {
                    this.scrollState.newMessageCount++;
                    this.updateNewMessageIndicator();
                }
            }
        }
        
        // 保存到本地存储（每隔几条消息保存一次，避免频繁保存）
        const currentMessages = this.state.currentConversation?.messages || [];
        if (currentMessages.length % 5 === 0) {
            this.saveConversations();
        }
        
        // 如果是AI消息，可能需要更新报告
        if ((message.type === 'ai' || message.type === 'assistant') && window.ReportSystem) {
            ReportSystem.updateReport(this.state.currentConversation);
        }
        
        return message;
    }
};

// 导出到全局
window.App = App;