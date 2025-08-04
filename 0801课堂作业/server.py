#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGenTest - 智能测试方案协作平台
简单Web服务器

启动命令：python server.py
访问地址：http://localhost:8123
"""

from flask import Flask, send_from_directory
import os

# 获取当前目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 创建Flask应用
app = Flask(__name__)

@app.route('/')
def index():
    """主页"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件"""
    return send_from_directory(BASE_DIR, filename)

@app.route('/js/<path:filename>')
def js_files(filename):
    """JS文件"""
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

if __name__ == '__main__':
    print("🚀 AIGenTest启动中...")
    print("📁 访问地址: http://localhost:8123")
    print("⏹️  按 Ctrl+C 停止服务器")
    
    app.run(host='0.0.0.0', port=8123, debug=False)