const WORKER_URL = "https://agent-ia.servpimc.workers.dev"; 
let userEmail = null;

marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erreur de décodage du token Google:", e);
        return null;
    }
}

async function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    
    if (payload && payload.email) {
        userEmail = payload.email;
        console.log("Email récupéré avec succès :", userEmail);
        document.getElementById("msg-agent-0").innerText = "Bienvenue ! Que puis-je faire pour vous ?";
        document.getElementById("google").close();
        afficheHistorique(userEmail);
        
    } else {
        console.warn("Impossible de récupérer l'email depuis le token.");
        document.getElementById("google_h2").innerText = "Une erreur est survenue";
    }
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "916642879878-hnvhqevu24dsm6inmbv1ikdfie1vs02a.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    const modal = document.getElementById('google');
    if (modal) {
        modal.showModal();
    }

    const btnContainer = document.getElementById("google-btn");
    if (btnContainer) {
        google.accounts.id.renderButton(
            btnContainer,
            { theme: "filled_blue", size: "big" }
        );
    }
}
