# radar_neuro
Agregador de periódicos de alto impacto de neurologia, separado por especialidade.

Aplicativo estático (PWA): basta publicar `index.html`, `sw.js`, `manifest.webmanifest` e os ícones no GitHub Pages. Todo o processamento ocorre no navegador.

## Como funciona a sincronização
1. **esearch** (um por periódico, campo `[ta]`): os 30 artigos mais recentes que entraram no PubMed na janela escolhida (`datetype=edat`).
2. **efetch** em formato MEDLINE (lotes de 200 PMIDs): título, resumo, descritores MeSH, palavras-chave, tipo de publicação, DOI e datas. Se um lote falhar, o app recorre ao **esummary** (só título).
3. **Classificação** em dois níveis (subespecialidade → grupo de doenças) usando título (peso maior), MeSH/palavras-chave e menções no resumo, mais o periódico de origem. Errata são descartadas.

Robustez de rede:
- limitador de taxa global (3 req/s sem chave, 10 req/s com Chave NCBI), que desacelera sozinho ao receber HTTP 429;
- novas tentativas com espera progressiva; troca automática para proxies CORS públicos quando a via direta falha, com "quarentena" das vias que não respondem;
- a Chave NCBI nunca é enviada aos proxies;
- falhas parciais não derrubam a sincronização (periódicos que falharam são tentados de novo e o aviso diz quais foram);
- cache de 6 h por janela, que é invalidado automaticamente quando a lista de periódicos ou a taxonomia muda;
- o service worker busca a página na rede primeiro, para que correções cheguem a quem já instalou o app.

## Palavras-chave da taxonomia (`CHANNELS` em `index.html`)
- `termo` → palavra inteira, sem diferenciar maiúsculas, aceitando plural (`seizure` casa com *seizures*; `neuropathy` com *neuropathies*);
- `termo*` → radical (`epilep*` = epilepsy, epileptic…); `*termo` → sufixo (`*gepant` = atogepant, rimegepant);
- `SIGLA` em maiúsculas → só casa em maiúsculas e como palavra isolada (`SMA` não casa com *small*).
