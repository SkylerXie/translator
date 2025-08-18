export default defineBackground(() => {
  console.log('翻译插件后台脚本已启动', { id: browser.runtime.id });

  // 监听来自content script的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('后台脚本收到消息:', message);

    // 处理测试消息
    if (message.action === 'test') {
      console.log('收到测试消息:', message.message);
      sendResponse({ success: true, message: '后台脚本已收到测试消息' });
      return true;
    }
    
    if (message.action === 'translateTexts') {
      // 立即发送响应，表示已收到请求
      sendResponse({ success: true, message: '已收到翻译请求，开始处理' });
      
      // 异步处理翻译请求
      (async () => {
        try {
          const { texts } = message;
          console.log('开始翻译文本，数量:', texts.length);
  
          // 获取用户设置
          const settings = await getTranslatorSettings();
          
          // 根据翻译引擎选择不同的处理策略
          if (settings.engine === 'google') {
            // 谷歌翻译：逐个文本翻译
            await translateTextsWithGoogle(texts, settings, sender.tab?.id);
          } else if (settings.engine === 'llm') {
            // 大模型：批量翻译
            await translateTextsWithLLM(texts, settings, sender.tab?.id);
          }
        } catch (error) {
          console.error('翻译文本失败:', error);
        }
      })();
      
      // 返回true表示我们将异步处理这个请求
      return true;
    }
    
    // 对于未处理的消息，返回false
    return false;
  });

  // 谷歌翻译：逐个文本处理
  async function translateTextsWithGoogle(texts: string[], settings: any, tabId?: number) {
    console.log('使用谷歌翻译，逐个文本处理，文本数量:', texts.length);
    
    for (const text of texts) {
      if (text && text.trim().length > 0) {
        try {
          const translatedText = await googleTranslateAPI(
            text,
            settings.sourceLanguage,
            settings.targetLanguage
          );

          // 发送翻译结果回content script
          if (tabId) {
            console.log("发送谷歌翻译结果:", {
              originalText: text,
              translatedText: translatedText
            });
            
            browser.tabs.sendMessage(tabId, {
              action: 'insertTranslation',
              originalText: text,
              translatedText: translatedText
            });
          }
        } catch (error) {
          console.error('谷歌翻译单个文本失败:', error, text);
        }
      }
    }
  }

  // 大模型翻译：批量翻译后分割
  async function translateTextsWithLLM(texts: string[], settings: any, tabId?: number) {
    console.log('使用大模型，批量翻译，文本数量:', texts.length);
    
    // 过滤有效的文本
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      return;
    }

    try {
      // 将所有文本合并，使用特殊分隔符
      const separator = '---TRANSLATE_SEPARATOR---';
      const batchText = validTexts.map(text => text.trim()).join(separator);
      
      console.log('批量翻译文本长度:', batchText.length);
      
      // 批量翻译
      const batchTranslatedText = await llmTranslateAPI(
        batchText,
        settings.sourceLanguage,
        settings.targetLanguage,
        settings.llmSettings,
        true // 标记为批量翻译
      );
      
      // 分割翻译结果
      const translatedParts = batchTranslatedText.split(separator).filter(txt => txt.trim() !== '');
      
      // 确保翻译结果数量与原文本数量匹配
      if (translatedParts.length !== validTexts.length) {
        console.warn('翻译结果数量与原文本数量不匹配，回退到大模型逐个翻译');
        console.log(batchTranslatedText);
        console.log(validTexts);

        // 如果结果少于原文，用空字符串补齐
        if (translatedParts.length < validTexts.length) {
          const missingCount = validTexts.length - translatedParts.length;
          console.log(`补齐 ${missingCount} 个空字符串`);
          for (let i = 0; i < missingCount; i++) {
            translatedParts.push('');
          }
        } else {
          // 如果结果多于原文，截取到原文数量
          translatedParts.splice(validTexts.length);
        }
      }

      console.log(batchTranslatedText);
      
      // 发送翻译结果
      for (let i = 0; i < validTexts.length; i++) {
        const text = validTexts[i];
        const translatedText = translatedParts[i].trim();
        
        if (tabId) {
          console.log("发送批量翻译结果:", {
            originalText: text,
            translatedText: translatedText
          });
          
          browser.tabs.sendMessage(tabId, {
            action: 'insertTranslation',
            originalText: text,
            translatedText: translatedText
          });
        }
      }
      
    } catch (error) {
      console.error('批量翻译失败，回退到大模型逐个翻译:', error);
      // 如果批量翻译失败，回退到大模型逐个翻译
      await translateTextsWithLLMIndividually(validTexts, settings, tabId);
    }
  }

  // 大模型逐个翻译（回退方案）
  async function translateTextsWithLLMIndividually(texts: string[], settings: any, tabId?: number) {
    console.log('使用大模型逐个翻译，文本数量:', texts.length);
    
    for (const text of texts) {
      if (text && text.trim().length > 0) {
        try {
          const translatedText = await llmTranslateAPI(
            text,
            settings.sourceLanguage,
            settings.targetLanguage,
            settings.llmSettings,
            false // 标记为单个翻译
          );

          // 发送翻译结果回content script
          if (tabId) {
            console.log("发送大模型单个翻译结果:", {
              originalText: text,
              translatedText: translatedText
            });
            
            browser.tabs.sendMessage(tabId, {
              action: 'insertTranslation',
              originalText: text,
              translatedText: translatedText
            });
          }
        } catch (error) {
          console.error('大模型翻译单个文本失败:', error, text);
        }
      }
    }
  }

  // 获取翻译器设置
  async function getTranslatorSettings() {
    try {
      // 尝试从 browser.storage.local 获取设置
      let result;
      try {
        result = await browser.storage.local.get([
          'translator-engine',
          'translator-source-lang',
          'translator-target-lang',
          'translator-llm-baseurl',
          'translator-llm-apikey',
          'translator-llm-model'
        ]);
      } catch (storageError) {
        console.warn('无法从 browser.storage.local 获取设置:', storageError);
        result = {};
      }

      // 如果 browser.storage.local 获取失败，使用默认值
      return {
        engine: result['translator-engine'] || 'google',
        sourceLanguage: result['translator-source-lang'] || 'auto',
        targetLanguage: result['translator-target-lang'] || 'zh',
        llmSettings: {
          baseUrl: result['translator-llm-baseurl'] || '',
          apiKey: result['translator-llm-apikey'] || '',
          modelName: result['translator-llm-model'] || 'gpt-3.5-turbo'
        }
      };
    } catch (error) {
      console.error('获取翻译设置失败:', error);
      // 返回默认设置
      return {
        engine: 'google',
        sourceLanguage: 'auto',
        targetLanguage: 'zh',
        llmSettings: {
          baseUrl: '',
          apiKey: '',
          modelName: 'gpt-3.5-turbo'
        }
      };
    }
  }

  // Google翻译API
  async function googleTranslateAPI(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      console.log("使用Google进行翻译");
      // 使用Google Translate的免费API
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      } else {
        throw new Error('Google翻译返回格式错误');
      }
    } catch (error) {
      console.error('Google翻译失败:', error);
      // 如果Google翻译失败，返回原文
      return `[翻译失败] ${text}`;
    }
  }

  // 大模型翻译API
  async function llmTranslateAPI(text: string, sourceLang: string, targetLang: string, llmSettings: any, isBatch: boolean): Promise<string> {
    try {
      if (!llmSettings.baseUrl || !llmSettings.apiKey) {
        throw new Error('LLM设置不完整');
      }

      console.log("使用大模型进行翻译", isBatch ? "(批量)" : "(单个)");
      
      let prompt;
      if (isBatch) {
        prompt = `请将以下文本从${getLanguageName(sourceLang)}翻译成${getLanguageName(targetLang)}。

文本中使用"---TRANSLATE_SEPARATOR---"分隔不同的段落，请保持相同的分隔符在翻译结果中，只翻译文本内容，不要翻译分隔符本身。

原文：
${text}

翻译要求：
1. 保持"---TRANSLATE_SEPARATOR---"分隔符不变
2. 只翻译文本内容
3. 保持相同的段落数量和顺序
4. 不要添加任何解释或说明`;
      } else {
        prompt = `请将以下文本从${getLanguageName(sourceLang)}翻译成${getLanguageName(targetLang)}，只返回翻译结果，不要添加任何解释：\n\n${text}`;
      }

      const response = await fetch(`${llmSettings.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmSettings.apiKey}`
        },
        body: JSON.stringify({
          model: llmSettings.modelName,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('LLM返回格式错误');
      }
    } catch (error) {
      console.error('LLM翻译失败:', error);
      return `[翻译失败] ${text}`;
    }
  }

  // 获取语言名称
  function getLanguageName(code: string): string {
    const languageMap: { [key: string]: string } = {
      'auto': '自动检测',
      'zh': '中文',
      'en': '英文',
      'ja': '日文',
      'ko': '韩文',
      'fr': '法文',
      'de': '德文',
      'es': '西班牙文',
      'ru': '俄文',
      'it': '意大利文'
    };
    return languageMap[code] || code;
  }
});