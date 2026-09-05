let googleIdToken = null;

function renderGoogleButton() {
    if (window.google && google.accounts) {
        google.accounts.id.initialize({
            client_id: "916642879878-hnvhqevu24dsm6inmbv1ikdfie1vs02a.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });

        const btnContainer = document.getElementById("google-btn");
        if (btnContainer) {
            google.accounts.id.renderButton(
                btnContainer,
                { theme: "filled_blue", size: "big" }
            );
        }
    }
}

function init() {
    const existingToken = localStorage.getItem("google_token");
    const modal = document.getElementById('google');
    const msgElement = document.getElementById("msg-agent-0");
    
    if (existingToken) {
        googleIdToken = localStorage.getItem("google_token")
        if (modal) modal.close();
        if (msgElement) msgElement.innerText = "Bienvenue ! Que puis-je faire pour vous ?";
        afficheHistorique();
    } else {
        if (modal) modal.showModal();
        renderGoogleButton();
    }
}

window.addEventListener('DOMContentLoaded', init);

async function handleCredentialResponse(response) {
    googleIdToken = response.credential;
    localStorage.setItem("google_token", googleIdToken);
    
    const msgElement = document.getElementById("msg-agent-0");
    if (msgElement) msgElement.innerText = "Bienvenue ! Que puis-je faire pour vous ?";
    
    const modal = document.getElementById("google");
    if (modal) modal.close();

    sessionStorage.removeItem("current_chat_id");
    getOrCreateChatId();
    afficheHistorique();
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("google_token");
    
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem("google_token");
        const modal = document.getElementById('google');
        if (modal) modal.showModal();
        renderGoogleButton();
        throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    return response;
}