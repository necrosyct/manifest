function gerarManifest() {
    const appid = document.getElementById("appid").value;
    const status = document.getElementById("status");

    if (!appid || isNaN(appid)) {
        status.textContent = "Por favor, insira um App ID válido (apenas números).";
        return;
    }

    const url = `https://generator.ryuu.lol/secure_download?appid=${appid}&auth_code=RYUUMANIFESTbx69kodfvxzxce`;

    // Redireciona para o link gerado
    window.location.href = url;
}
