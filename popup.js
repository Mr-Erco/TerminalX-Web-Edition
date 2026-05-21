document.addEventListener('DOMContentLoaded', () => {
    const scriptList = document.getElementById('scriptList');
    const codeEditor = document.getElementById('codeEditor');
    const scriptNameInput = document.getElementById('scriptName');
    const matchPatternInput = document.getElementById('matchPattern');
    const themeSelect = document.getElementById('themeSelect');
    const terminalOutput = document.getElementById('terminalOutput');
    const runBtn = document.getElementById('runBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newScriptBtn = document.querySelector('.btn-new-script');
    const clearTerminal = document.getElementById('clearTerminal');

    let scripts = [];
    let activeScriptId = null;

    // Load everything
    function loadData() {
        chrome.storage.local.get(['terminalXScripts', 'terminalXTheme'], (result) => {
            // Load Scripts
            scripts = result.terminalXScripts || [
                {
                    id: Date.now(),
                    name: 'YouTube AdBlocker',
                    code: '// YouTube AdBlocker\n(function() {\n    console.log("Terminal X: AdBlock active");\n})();',
                    pattern: '*://*.youtube.com/*',
                    enabled: true
                }
            ];
            
            // Load Theme
            const savedTheme = result.terminalXTheme || 'theme-terminal-x';
            applyTheme(savedTheme);
            themeSelect.value = savedTheme;

            renderScriptList();
            if (scripts.length > 0) {
                selectScript(scripts[0].id);
            }
        });
    }

    function applyTheme(themeClass) {
        document.body.className = themeClass;
        chrome.storage.local.set({ terminalXTheme: themeClass });
    }

    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        logToTerminal(`Theme changed to: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });

    function renderScriptList() {
        scriptList.innerHTML = '';
        scripts.forEach(script => {
            const li = document.createElement('li');
            li.className = `script-item ${script.id === activeScriptId ? 'active' : ''}`;
            li.dataset.id = script.id;
            
            li.innerHTML = `
                <span class="script-name">${script.name}</span>
                <label class="switch">
                    <input type="checkbox" ${script.enabled ? 'checked' : ''} class="toggle-enabled">
                    <span class="slider"></span>
                </label>
            `;

            li.addEventListener('click', (e) => {
                if (!e.target.classList.contains('toggle-enabled') && !e.target.classList.contains('slider')) {
                    selectScript(script.id);
                }
            });

            li.querySelector('.toggle-enabled').addEventListener('change', (e) => {
                script.enabled = e.target.checked;
                saveToStorage();
                logToTerminal(`[INFO] ${script.name} ${script.enabled ? 'enabled' : 'disabled'}`);
            });

            scriptList.appendChild(li);
        });
    }

    function selectScript(id) {
        activeScriptId = id;
        const script = scripts.find(s => s.id === id);
        if (script) {
            scriptNameInput.value = script.name;
            codeEditor.value = script.code;
            matchPatternInput.value = script.pattern;
            renderScriptList();
            logToTerminal(`Loaded script: ${script.name}`);
        }
    }

    newScriptBtn.addEventListener('click', () => {
        const newScript = {
            id: Date.now(),
            name: `New Script ${scripts.length + 1}`,
            code: '// New Script\nconsole.log("Terminal X Running...");',
            pattern: '<all_urls>',
            enabled: true
        };
        scripts.push(newScript);
        saveToStorage();
        selectScript(newScript.id);
        logToTerminal(`Created: ${newScript.name}`, 'info');
    });

    saveBtn.addEventListener('click', () => {
        const script = scripts.find(s => s.id === activeScriptId);
        if (script) {
            script.name = scriptNameInput.value || 'Untitled Script';
            script.code = codeEditor.value;
            script.pattern = matchPatternInput.value;
            saveToStorage();
            renderScriptList();
            logToTerminal(`[SUCCESS] Saved: ${script.name}`, 'info');
        }
    });

    runBtn.addEventListener('click', () => {
        const script = scripts.find(s => s.id === activeScriptId);
        if (script) {
            logToTerminal(`Executing ${script.name}...`, 'prompt');
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: {tabId: tabs[0].id},
                        func: (code) => { try { eval(code); } catch(e) { console.error(e); } },
                        args: [codeEditor.value]
                    }, () => logToTerminal(`[DONE] Execution finished.`, 'info'));
                }
            });
        }
    });

    function saveToStorage() {
        chrome.storage.local.set({ terminalXScripts: scripts });
    }

    clearTerminal.addEventListener('click', () => {
        terminalOutput.innerHTML = '';
        logToTerminal('Terminal cleared.');
    });

    function logToTerminal(message, type = '') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        let prefix = type === 'prompt' ? '<span class="prompt">$</span> ' : (type === 'info' ? '<span class="info">[INFO]</span> ' : '');
        line.innerHTML = `${prefix}${message}`;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    loadData();
});
