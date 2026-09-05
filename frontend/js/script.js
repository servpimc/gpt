const WORKER_URL = "https://gpt.servpimc.workers.dev";

marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

function cleanMarkdown(rawText) {
    if (!rawText) return '';

  let text = rawText
    // 1. Remplace les espaces insecables (&nbsp; / \u00A0) par des espaces normaux
    .replace(/\u00A0/g, ' ')
    // 2. Nettoie les espaces multiples consécutifs dans les lignes du tableau
    .replace(/ {2,}/g, ' ')
    // 3. Convertit les \n littéraux
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');

  // Traitement du tableau (pour garder le code sur une seule ligne inline dans les cellules)
  text = text.replace(/(\|[^\n]*)(```(?:js|javascript)?\n?([\s\S]*?)```)/g, (match, prefix, fullCode, innerCode) => {
    const singleLineCode = innerCode.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim();
    return `${prefix}\`${singleLineCode}\``;
  });

  return text;
}