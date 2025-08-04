/**
 * @专家和表情功能模块
 * 处理专家提及和表情选择
 */

window.MentionEmojiSystem = {
    // 状态
    state: {
        isEmojiPanelOpen: false,
        isMentionModalOpen: false,
        lastCursorPosition: 0
    },

    // 初始化
    init() {
        console.log('🎯 初始化@专家和表情功能');
        this.bindEvents();
        this.setupKeyboardListeners();
    },

    // 绑定事件
    bindEvents() {
        // @专家按钮
        const mentionBtn = document.getElementById('mentionExpertBtn');
        if (mentionBtn) {
            mentionBtn.addEventListener('click', () => this.openMentionModal());
        }

        // 表情按钮
        const emojiBtn = document.getElementById('emojiBtn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiPanel());
        }

        // 关闭@专家弹窗
        const closeMentionModal = document.getElementById('closeMentionModal');
        if (closeMentionModal) {
            closeMentionModal.addEventListener('click', () => this.closeMentionModal());
        }

        // 关闭表情面板
        const closeEmojiPanel = document.getElementById('closeEmojiPanel');
        if (closeEmojiPanel) {
            closeEmojiPanel.addEventListener('click', () => this.closeEmojiPanel());
        }

        // 专家搜索
        const expertSearch = document.getElementById('expertSearch');
        if (expertSearch) {
            expertSearch.addEventListener('input', (e) => this.filterExperts(e.target.value));
        }

        // 表情选择
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.getAttribute('data-emoji');
                this.insertEmoji(emoji);
            });
        });

        // 点击外部关闭
        const mentionModal = document.getElementById('mentionExpertModal');
        if (mentionModal) {
            mentionModal.addEventListener('click', (e) => {
                if (e.target === mentionModal) {
                    this.closeMentionModal();
                }
            });
        }

        // 输入框焦点监听
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('focus', () => {
                this.closeEmojiPanel();
            });
            
            // 监听@符号输入
            messageInput.addEventListener('input', (e) => {
                this.handleAtInput(e);
            });
        }
    },

    // 设置键盘监听
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // ESC键关闭弹窗
            if (e.key === 'Escape') {
                this.closeMentionModal();
                this.closeEmojiPanel();
            }
        });
    },

    // 打开@专家弹窗
    openMentionModal() {
        console.log('📞 打开@专家选择弹窗');
        
        const modal = document.getElementById('mentionExpertModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.state.isMentionModalOpen = true;
            
            // 加载专家列表
            this.loadExpertList();
            
            // 聚焦搜索框
            setTimeout(() => {
                const searchInput = document.getElementById('expertSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        }
    },

    // 关闭@专家弹窗
    closeMentionModal() {
        const modal = document.getElementById('mentionExpertModal');
        if (modal) {
            modal.classList.add('hidden');
            this.state.isMentionModalOpen = false;
        }
    },

    // 切换表情面板
    toggleEmojiPanel() {
        if (this.state.isEmojiPanelOpen) {
            this.closeEmojiPanel();
        } else {
            this.openEmojiPanel();
        }
    },

    // 打开表情面板
    openEmojiPanel() {
        console.log('😊 打开表情选择面板');
        
        const panel = document.getElementById('emojiPanel');
        if (panel) {
            panel.classList.remove('hidden');
            this.state.isEmojiPanelOpen = true;
            
            // 调整面板位置
            this.adjustEmojiPanelPosition();
        }
    },

    // 关闭表情面板
    closeEmojiPanel() {
        const panel = document.getElementById('emojiPanel');
        if (panel) {
            panel.classList.add('hidden');
            this.state.isEmojiPanelOpen = false;
        }
    },

    // 调整表情面板位置
    adjustEmojiPanelPosition() {
        const panel = document.getElementById('emojiPanel');
        const inputArea = document.getElementById('inputArea');
        
        if (panel && inputArea) {
            const inputRect = inputArea.getBoundingClientRect();
            panel.style.bottom = `${window.innerHeight - inputRect.top + 10}px`;
        }
    },

    // 加载专家列表
    loadExpertList() {
        const expertList = document.getElementById('expertList');
        if (!expertList) return;

        // 获取当前专家列表
        const experts = this.getAvailableExperts();
        
        expertList.innerHTML = '';
        
        experts.forEach(expert => {
            const expertItem = document.createElement('div');
            expertItem.className = 'flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors';
            expertItem.innerHTML = `
                <div class="expert-avatar expert-online" title="${expert.name}">
                    ${expert.avatar}
                </div>
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${expert.name}</div>
                    <div class="text-sm text-gray-500">${expert.description}</div>
                </div>
            `;
            
            expertItem.addEventListener('click', () => {
                this.mentionExpert(expert);
            });
            
            expertList.appendChild(expertItem);
        });
    },

    // 获取可用专家列表
    getAvailableExperts() {
        // 首先尝试从ExpertSystem获取专家
        if (window.ExpertSystem) {
            try {
                const systemExperts = window.ExpertSystem.getAllExperts();
                if (systemExperts && systemExperts.length > 0) {
                    console.log('📋 从ExpertSystem获取专家列表:', systemExperts.length);
                    return systemExperts;
                }
            } catch (error) {
                console.warn('从ExpertSystem获取专家失败:', error);
            }
        }

        // 从应用状态获取专家
        if (window.App?.state?.experts) {
            try {
                const appExperts = window.App.state.experts;
                if (appExperts && appExperts.length > 0) {
                    console.log('📋 从App状态获取专家列表:', appExperts.length);
                    return appExperts;
                }
            } catch (error) {
                console.warn('从App状态获取专家失败:', error);
            }
        }

        // 备用专家列表
        console.log('📋 使用备用专家列表');
        return [
            {
                id: 'requirements_analyst',
                name: '需求分析师',
                avatar: '📋',
                description: '分析和理解用户需求',
                role: 'analyst'
            },
            {
                id: 'test_strategist',
                name: '测试策略师',
                avatar: '🎯',
                description: '制定测试策略和计划',
                role: 'strategist'
            },
            {
                id: 'tech_advisor',
                name: '技术选型师',
                avatar: '🔧',
                description: '推荐测试工具和技术',
                role: 'tech'
            },
            {
                id: 'risk_controller',
                name: '风险控制师',
                avatar: '⚠️',
                description: '识别和控制质量风险',
                role: 'risk'
            },
            {
                id: 'case_researcher',
                name: '案例研究员',
                avatar: '📚',
                description: '查找最佳实践和案例',
                role: 'research'
            },
            {
                id: 'cost_estimator',
                name: '成本评估师',
                avatar: '💰',
                description: '评估测试成本和资源',
                role: 'cost'
            },
            {
                id: 'solution_integrator',
                name: '方案整合师',
                avatar: '🔗',
                description: '整合和输出最终方案',
                role: 'integration'
            }
        ];
    },

    // 过滤专家
    filterExperts(searchTerm) {
        const expertList = document.getElementById('expertList');
        if (!expertList) return;

        const expertItems = expertList.querySelectorAll('div[class*="flex items-center"]');
        
        expertItems.forEach(item => {
            const expertName = item.querySelector('.font-medium').textContent;
            const expertDesc = item.querySelector('.text-sm').textContent;
            
            const matches = expertName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expertDesc.toLowerCase().includes(searchTerm.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
        });
    },

    // @专家
    mentionExpert(expert) {
        console.log('📞 提及专家:', expert.name);
        
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        // 获取当前光标位置
        const cursorPos = messageInput.selectionStart;
        const currentValue = messageInput.value;
        
        // 构建@专家标记
        const mentionText = `@${expert.name} `;
        
        // 插入@专家标记
        const newValue = currentValue.slice(0, cursorPos) + mentionText + currentValue.slice(cursorPos);
        messageInput.value = newValue;
        
        // 设置新的光标位置
        const newCursorPos = cursorPos + mentionText.length;
        messageInput.setSelectionRange(newCursorPos, newCursorPos);
        
        // 聚焦输入框
        messageInput.focus();
        
        // 关闭弹窗
        this.closeMentionModal();
        
        // 触发input事件以便其他系统感知变化
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    },

    // 插入表情
    insertEmoji(emoji) {
        console.log('😊 插入表情:', emoji);
        
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        // 获取当前光标位置
        const cursorPos = messageInput.selectionStart;
        const currentValue = messageInput.value;
        
        // 插入表情
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        messageInput.value = newValue;
        
        // 设置新的光标位置
        const newCursorPos = cursorPos + emoji.length;
        messageInput.setSelectionRange(newCursorPos, newCursorPos);
        
        // 聚焦输入框
        messageInput.focus();
        
        // 关闭表情面板
        this.closeEmojiPanel();
        
        // 触发input事件
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    },

    // 处理@符号输入
    handleAtInput(e) {
        const input = e.target;
        const value = input.value;
        const cursorPos = input.selectionStart;
        
        // 检查是否在光标前输入了@
        if (value[cursorPos - 1] === '@') {
            console.log('🎯 检测到@符号输入，自动打开专家选择');
            // 延迟一点打开，避免影响输入
            setTimeout(() => {
                this.openMentionModal();
            }, 100);
        }
    },

    // 解析消息中的@专家
    parseMentions(message) {
        console.log('🔍 解析@专家提及，消息:', message);
        
        const mentionRegex = /@([^\s@]+)/g;
        const mentions = [];
        let match;
        
        const experts = this.getAvailableExperts();
        console.log('📋 可用专家列表:', experts.map(e => e.name));
        
        while ((match = mentionRegex.exec(message)) !== null) {
            const expertName = match[1];
            console.log('🔍 检查专家名称:', expertName);
            
            const expert = experts.find(e => e.name === expertName);
            
            if (expert) {
                console.log('✅ 找到匹配专家:', expert);
                mentions.push({
                    name: expertName,
                    expert: expert,
                    position: match.index,
                    length: match[0].length
                });
            } else {
                console.log('❌ 未找到匹配专家:', expertName);
            }
        }
        
        console.log('📞 解析结果:', mentions);
        return mentions;
    },

    // 高亮显示@专家
    highlightMentions(message) {
        const mentions = this.parseMentions(message);
        let highlightedMessage = message;
        
        // 从后往前替换，避免位置偏移
        mentions.reverse().forEach(mention => {
            const mentionHtml = `<span class="mention-expert bg-blue-100 text-blue-800 px-1 rounded" data-expert="${mention.name}">@${mention.name}</span>`;
            highlightedMessage = highlightedMessage.slice(0, mention.position) + 
                               mentionHtml + 
                               highlightedMessage.slice(mention.position + mention.length);
        });
        
        return highlightedMessage;
    },

    // 获取提及的专家列表
    getMentionedExperts(message) {
        const mentions = this.parseMentions(message);
        return mentions.map(m => m.expert);
    }
};

// 样式增强
const mentionEmojiStyles = `
<style>
.mention-expert {
    cursor: pointer;
    transition: all 0.2s ease;
}

.mention-expert:hover {
    background-color: #3b82f6 !important;
    color: white !important;
    transform: scale(1.05);
}

.emoji-btn {
    transition: all 0.2s ease;
}

.emoji-btn:hover {
    transform: scale(1.2);
}

.expert-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.expert-online {
    position: relative;
}

.expert-online::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
}

#emojiPanel {
    animation: slideUp 0.2s ease-out;
}

#mentionExpertModal .bg-white {
    animation: modalAppear 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes modalAppear {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 响应式调整 */
@media (max-width: 640px) {
    #emojiPanel {
        width: calc(100vw - 2rem);
        left: 1rem;
        right: 1rem;
    }
    
    #mentionExpertModal .max-w-md {
        max-width: calc(100vw - 2rem);
    }
}
</style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', mentionEmojiStyles);