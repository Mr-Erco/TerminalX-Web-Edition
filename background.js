// Background script for Terminal X Web Companion
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.storage.local.get(['terminalXScripts'], (result) => {
            const scripts = result.terminalXScripts || [];
            scripts.forEach(script => {
                if (script.enabled && matchesPattern(tab.url, script.pattern)) {
                    console.log(`Injecting script: ${script.name} into ${tab.url}`);
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: (code) => {
                            try {
                                const s = document.createElement('script');
                                s.textContent = code;
                                (document.head || document.documentElement).appendChild(s);
                                s.remove();
                            } catch (e) {
                                console.error("Terminal X Injection Error:", e);
                            }
                        },
                        args: [script.code]
                    });
                }
            });
        });
    }
});

function matchesPattern(url, pattern) {
    if (pattern === '<all_urls>' || pattern === '*') return true;
    try {
        const regex = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
        return regex.test(url);
    } catch (e) {
        return false;
    }
}
