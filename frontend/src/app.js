/* ============================================================
   APP.JS — orquestrador principal da SPA PostaAê
   responsabilidade exclusiva: coordenar módulos e rotas
   
   o app.js não sabe:
   ── como montar skeleton → helpers/skeleton.js sabe
   ── como fazer fetch     → helpers/requisicao.js saberá
   ── como renderizar feed → src/postagens.js saberá
   ── como renderizar post → src/post.js saberá
   
   o app.js só sabe:
   ── qual módulo chamar para cada rota
   ── qual CSS carregar para cada rota
   ── em qual ordem inicializar tudo
   
   qualquer engenheiro novo lê esse arquivo em 30 segundos
   e entende o fluxo completo da aplicação — esse é o objetivo
   ============================================================ */

/* ------------------------------------------------------------
   IMPORTS
   cada import traz um módulo com responsabilidade única
   o app.js só importa o que precisa — zero código desnecessário
   ------------------------------------------------------------ */

// módulo completo de skeleton — o app.js não sabe como funciona por dentro
// só sabe que initSkeleton() prepara tudo e as funções mostram cada skeleton
import { initSkeleton, mostrarSkeletonInicial, mostrarSkeletonFeed, mostrarSkeletonPost, mostrarSkeletonFormulario } from "../helpers/skeleton.js";

// futuros imports — adicionados conforme implementados
// import { carregarCSS }      from '../helpers/css.js';
// import { renderizarFeed }   from './postagens.js';
// import { renderizarPost }   from './post.js';
// import { renderizarPostar } from './postar.js';

/* ------------------------------------------------------------
   SISTEMA DE CSS SOB DEMANDA
   só os CSS de componentes — skeleton.js gerencia seus próprios
   ------------------------------------------------------------ */

// controla quais CSS de componentes já foram baixados nesta sessão
const cssCarregados = new Set();

/**
 * carregarCSS — injeta CSS de componente sob demanda
 * @param {string} nomeArquivo — nome sem extensão
 * @returns {Promise}
 */
function carregarCSS(nomeArquivo) {
    if (cssCarregados.has(nomeArquivo)) return Promise.resolve();

    return new Promise((resolver) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `assets/css/${nomeArquivo}.css`;
        cssCarregados.add(nomeArquivo);
        link.onload = resolver;
        document.head.appendChild(link);
    });
}

/* ------------------------------------------------------------
   ROTEAMENTO CLIENT-SIDE
   mapeia URLs para CSS + skeleton + componente de renderização
   é o router.get() do Express — mas no browser
   ------------------------------------------------------------ */

/**
 * renderizarRota — decide o que fazer para cada URL
 * @param {string} rota — pathname atual
 */
async function renderizarRota(rota) {
    // feed — rota raiz
    if (rota === "/") {
        await carregarCSS("feed");
        mostrarSkeletonFeed(3);
        // await renderizarFeed();
        return;
    }

    // post individual
    if (rota.startsWith("/post/")) {
        await carregarCSS("post");
        mostrarSkeletonPost(4);
        const slug = rota.replace("/post/", "");
        // await renderizarPost(slug);
        return;
    }

    // formulário de novo post
    if (rota === "/postar") {
        await carregarCSS("formulario");
        mostrarSkeletonFormulario();
        // await renderizarFormulario();
        return;
    }

    // rota não mapeada — 404 dentro da SPA
    renderizar404();
}

/**
 * renderizar404 — tela de erro para rotas não mapeadas
 */
function renderizar404() {
    document.querySelector("#app").innerHTML = `
        <div style="padding: var(--espaco-xl); text-align: center;">
            <p style="color: var(--cor-timestamp);">Página não encontrada</p>
        </div>
    `;
    document.title = "Página não encontrada — PostaAê";
}

/* ------------------------------------------------------------
   INICIALIZAÇÃO
   6 linhas que descrevem o boot completo da SPA
   qualquer engenheiro entende o fluxo sem ler mais nada
   ------------------------------------------------------------ */

/**
 * inicializarSPA — ponto de entrada da aplicação
 */
async function inicializarSPA() {
    // prepara todo o sistema de skeleton — deferred incluído
    // quando resolver, shimmer está em cache para todas as rotas
    await initSkeleton();

    // carrega CSS estrutural base — necessário em todas as rotas
    await carregarCSS("layout");

    // renderiza a rota que o usuário acessou
    await renderizarRota(window.location.pathname);

    // registra navegação do browser — botões voltar/avançar funcionam
    window.addEventListener("popstate", () => {
        renderizarRota(window.location.pathname);
    });
}

// inicia a SPA quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", inicializarSPA);
