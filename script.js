// Chave de autenticação Ryuu (Usada nos seus arquivos Python)
const RYUU_AUTH_CODE = "RYUUMANIFESTbx69ko";
const MANIFEST_DATA_URL = "https://generator.ryuu.lol/secure_download";

// Elementos DOM
const statusArea = document.getElementById('statusArea');
const statusText = document.getElementById('statusText');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsTitle = document.getElementById('resultsTitle');
const resultsList = document.getElementById('resultsList');
const rawOutput = document.getElementById('rawOutput');
const downloadButton = document.getElementById('downloadButton');
const copyButton = document.getElementById('copyButton');

/**
 * Atualiza a área de status e controla o spinner e o botão.
 * @param {string} message - A mensagem de status a ser exibida.
 * @param {boolean} isError - Se é uma mensagem de erro (usa cor vermelha).
 * @param {boolean} isLoading - Se está carregando (usa spinner e desativa o botão).
 */
function setStatus(message, isError = false, isLoading = false) {
    statusArea.classList.remove('hidden');

    // Reset classes
    statusArea.classList.remove('bg-red-900/40', 'bg-green-900/40', 'bg-steam-blue/20', 'text-red-300', 'text-green-300', 'text-steam-light');
    statusText.classList.remove('text-red-300', 'text-green-300', 'text-steam-light');

    if (isError) {
        statusArea.classList.add('bg-red-900/40');
        statusText.classList.add('text-red-300');
    } else if (!isLoading) {
        statusArea.classList.add('bg-green-900/40');
        statusText.classList.add('text-green-300');
    } else {
        statusArea.classList.add('bg-steam-blue/20');
        statusText.classList.add('text-steam-light');
    }

    statusText.textContent = message;

    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        downloadButton.disabled = true;
    } else {
        loadingSpinner.classList.add('hidden');
        downloadButton.disabled = false;
    }
}

/**
 * Exibe a lista formatada de Depots e Keys.
 * @param {object} data - O objeto JSON validado da API.
 */
function displayResults(data) {
    resultsList.innerHTML = '';
    resultsTitle.classList.remove('hidden');
    copyButton.classList.remove('hidden');
    rawOutput.classList.add('hidden'); // Oculta a saída bruta no sucesso

    const keys = data.depot_keys;

    if (keys && keys.length > 0) {
        setStatus(`✅ Sucesso! ${keys.length} Depots encontrados.`, false, false);

        keys.forEach(item => {
            const depotId = item.depot_id;
            const key = item.key;
            const manifestId = item.latest_manifest_id || 'N/A';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'p-3 bg-steam-blue/30 rounded-lg border border-steam-blue/50';
            itemDiv.innerHTML = `
                <p class="text-sm font-bold text-steam-light">Depot ID: ${depotId}</p>
                <p class="text-xs text-gray-400">Manifest ID: ${manifestId}</p>
                <p class="text-xs text-gray-200">Key: <span class="font-mono">${key}</span></p>
            `;
            resultsList.appendChild(itemDiv);
        });
    } else {
         setStatus('⚠️ Resposta Válida, mas sem chaves de Depot (App ID pode estar incorreto ou indisponível).', true, false);
    }
}

/**
 * Exibe uma mensagem de erro e opcionalmente o conteúdo cru da resposta.
 * @param {string} message - A mensagem de erro amigável.
 * @param {string | null} rawContent - O conteúdo cru da resposta para debug.
 */
function handleError(message, rawContent = null) {
    setStatus(`❌ Erro: ${message}`, true, false);
    resultsTitle.classList.add('hidden');
    resultsList.innerHTML = '';
    copyButton.classList.add('hidden');

    if (rawContent) {
        rawOutput.value = `ERRO DE PARSING JSON (RESPOSTA CRUA):\n${rawContent}`;
        rawOutput.classList.remove('hidden');
        // Permite copiar a saída bruta em caso de erro
        copyButton.classList.remove('hidden');
    } else {
        rawOutput.classList.add('hidden');
    }
}

/**
 * Função principal que chama a API Ryuu.
 * Esta função é chamada pelo botão no HTML.
 */
async function downloadManifests() {
    const appId = document.getElementById('appIdInput').value.trim();
    if (!appId || isNaN(appId)) {
        handleError("Por favor, insira um App ID numérico válido.");
        return;
    }

    setStatus("Consultando API...", false, true);
    resultsList.innerHTML = '';
    resultsTitle.classList.add('hidden');
    rawOutput.classList.add('hidden');
    copyButton.classList.add('hidden');

    // Construção da URL com o App ID dinâmico
    const url = `${MANIFEST_DATA_URL}?appid=${appId}&auth_code=${RYUU_AUTH_CODE}`;

    try {
        const response = await fetch(url);
        const rawContent = await response.text();

        if (!response.ok) {
            // Trata erros HTTP 4xx/5xx, usando o texto cru como mensagem
            throw new Error(`Erro HTTP ${response.status}: ${rawContent}`);
        }

        // Tenta fazer o parsing JSON.
        let data;
        try {
            data = JSON.parse(rawContent);
        } catch (e) {
            // Erro de JSONDecodeError. Mostra a resposta crua da API.
            handleError("A API Ryuu retornou uma mensagem de erro que não é JSON. Verifique a saída bruta.", rawContent);
            return;
        }

        // Se chegou aqui, o JSON é válido
        displayResults(data);

    } catch (error) {
        // Trata erros de rede, timeout, ou a exceção do throw Error acima
        handleError(error.message);
    }
}

/**
 * Copia os resultados formatados (sucesso) ou o conteúdo cru (erro) para a área de transferência.
 * Esta função é chamada pelo botão no HTML.
 */
function copyResults() {
    let textToCopy;
    if (rawOutput.value && !rawOutput.classList.contains('hidden')) {
        // Se houver erro e o rawOutput estiver visível
        textToCopy = rawOutput.value;
    } else {
        // Caso de sucesso: formata o texto para ser copiável
        const appId = document.getElementById('appIdInput').value.trim();
        let output = `Manifest Keys para AppID: ${appId}\n\n`;

        resultsList.querySelectorAll('.p-3').forEach(div => {
            // Extrai as informações dos elementos HTML gerados
            const depotId = div.querySelector('.font-bold').textContent.replace('Depot ID: ', '');
            const manifestId = div.querySelector('.text-gray-400').textContent.replace('Manifest ID: ', '');
            const key = div.querySelector('.font-mono').textContent;

            output += `Depot ID: ${depotId}\nManifest ID: ${manifestId}\nKey: ${key}\n---\n`;
        });
        textToCopy = output;
    }

    // Copia para a área de transferência
    try {
        // Uso execCommand para maior compatibilidade em iFrames
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        setStatus('Resultados copiados para a área de transferência!', false, false);
    } catch (err) {
        console.error('Falha ao copiar:', err);
        setStatus('Falha ao copiar. Tente selecionar o texto da área de saída bruta.', true, false);
    }
}
