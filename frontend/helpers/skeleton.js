/* ============================================================
   HELPERS/SKELETON.JS
   responsabilidade: tudo relacionado a skeleton loading
   ── montar os elementos visuais no DOM
   ── carregar os arquivos CSS de skeleton
   ── orquestrar a sequência de carregamento progressivo
   
   o app.js chama apenas initSkeleton() e as funções de exibição
   toda a lógica de CSS deferred, Set de controle e sequência
   vive aqui — o app.js não precisa saber como funciona por dentro
   
   é o mesmo princípio que o Instagram usa internamente —
   o módulo de skeleton é completamente autossuficiente
   o orquestrador só chama — nunca implementa
   ============================================================ */

/* ------------------------------------------------------------
   CONTROLE INTERNO DE CSS
   o Set vive aqui — não no app.js
   skeleton.js é o único responsável por carregar seus próprios CSS
   o app.js não sabe que skeleton-minimo e skeleton-completo existem
   é o princípio de encapsulamento — o módulo gerencia seus recursos
   ------------------------------------------------------------ */

// registra quais arquivos CSS de skeleton já foram carregados
// evita downloads duplicados mesmo que as funções sejam chamadas várias vezes
const cssSkeletonCarregados = new Set();

/* ------------------------------------------------------------
   FUNÇÕES INTERNAS — privadas, não exportadas
   usadas apenas dentro deste módulo
   o app.js nunca as chama diretamente
   ------------------------------------------------------------ */

/**
 * _carregarCSSskeleton (privada)
 * injeta um arquivo CSS de skeleton no <head>
 * prefixo _ indica que é privada — convenção do Instagram e Reddit
 *
 * @param {string} nomeArquivo — nome sem extensão
 * @returns {Promise} — resolve quando o CSS estiver aplicado
 */
function _carregarCSSskeleton(nomeArquivo) {
    // já foi carregado — retorna imediatamente sem fazer nada
    // o browser já tem o arquivo em cache — zero custo de rede
    if (cssSkeletonCarregados.has(nomeArquivo)) {
        return Promise.resolve();
    }

    // cria e retorna a Promise de carregamento
    return new Promise((resolver) => {
        // cria o elemento <link> para carregar o CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `assets/css/${nomeArquivo}.css`;

        // registra antes do onload — evita race condition
        // se chamada novamente antes do download terminar
        // o Set já tem o arquivo — zero download duplicado
        cssSkeletonCarregados.add(nomeArquivo);

        // resolve quando o browser terminou de baixar e aplicar
        link.onload = resolver;

        // injeta no <head> — browser inicia o download imediatamente
        document.head.appendChild(link);
    });
}

/**
 * _gerarCardFeed (privada)
 * gera o HTML de um único card skeleton do feed
 * separada para que mostrarSkeletonFeed possa reutilizá-la
 * o Reddit usa funções geradoras assim para evitar repetição
 *
 * @returns {string} — HTML do card skeleton
 */
function _gerarCardFeed() {
    return `
        <div class="skeleton-post">
            <div class="skeleton-post__autor">
                <div class="skeleton skeleton-post__avatar"></div>
                <div class="skeleton skeleton-post__nome"></div>
            </div>
            <div class="skeleton skeleton-post__titulo"></div>
            <div class="skeleton skeleton-post__conteudo"></div>
            <div class="skeleton skeleton-post__acoes"></div>
        </div>
    `;
}

/**
 * _gerarCardComentario (privada)
 * gera o HTML de um único comentário skeleton
 * reutilizada por mostrarSkeletonPost
 *
 * @returns {string} — HTML do comentário skeleton
 */
function _gerarCardComentario() {
    return `
        <div class="skeleton-comentario">
            <div class="skeleton-comentario__autor">
                <div class="skeleton skeleton-comentario__avatar"></div>
                <div class="skeleton skeleton-comentario__nome"></div>
            </div>
            <div class="skeleton skeleton-comentario__texto"></div>
        </div>
    `;
}

/* ------------------------------------------------------------
   FUNÇÕES PÚBLICAS — exportadas para o app.js usar
   são a interface pública do módulo
   o app.js só conhece essas funções — nunca as internas
   ------------------------------------------------------------ */

/**
 * initSkeleton (pública)
 * responsabilidade: orquestrar toda a sequência de inicialização
 * é a única função que o app.js precisa chamar na inicialização
 * cuida de tudo internamente:
 * ── mostra skeleton mínimo imediatamente
 * ── baixa skeleton-completo em segundo plano
 * ── avisa o app.js quando está pronto para renderizar rotas
 *
 * o app.js não sabe que skeleton-minimo e skeleton-completo existem
 * ele só chama initSkeleton() e espera o sinal de pronto
 * é o mesmo padrão que o Facebook usa no boot do feed —
 * um único ponto de entrada que gerencia toda a complexidade interna
 *
 * @returns {Promise} — resolve quando skeleton-completo estiver em cache
 *                      o app.js awaita essa Promise antes de renderizar rotas
 *                      garante que shimmer está ativo em todas as rotas
 */
export async function initSkeleton() {
    // PASSO 1 — mostra os 3 retângulos genéricos imediatamente
    // skeleton-minimo.css já está em cache via <head> do index.html
    // zero tela branca — first paint crítico garantido
    mostrarSkeletonInicial();

    // PASSO 2 — baixa skeleton-completo em segundo plano
    // await aqui — o app.js só renderiza rotas depois que o shimmer
    // estiver em cache — garante zero inconsistência visual entre rotas
    await _carregarCSSskeleton("skeleton-completo");

    // quando essa Promise resolver, o cascade CSS já redefiniu .skeleton
    // todos os retângulos na tela têm shimmer — o app.js pode prosseguir
}

/**
 * mostrarSkeletonInicial (pública)
 * 3 retângulos genéricos do skeleton-minimo
 * chamada internamente pelo initSkeleton e externamente pelo app.js
 * quando o app.js troca de rota, chama essa função para reset visual
 */
export function mostrarSkeletonInicial() {
    // conteúdo fixo — não vem do usuário — innerHTML seguro
    document.querySelector("#app").innerHTML = `
        <div class="skeleton skeleton-topo"></div>
        <div class="skeleton skeleton-bloco"></div>
        <div class="skeleton skeleton-bloco"></div>
    `;
}

/**
 * mostrarSkeletonFeed (pública)
 * skeleton estruturado da rota /
 * só chamada depois que initSkeleton() resolveu —
 * shimmer garantido em cache
 *
 * @param {number} quantidade — número de cards — padrão 3
 */
export function mostrarSkeletonFeed(quantidade = 3) {
    // gera N cards usando a função geradora privada
    // Array.from + map + join — um único innerHTML — um único reflow
    const cards = Array.from({ length: quantidade }).map(_gerarCardFeed).join("");

    // injeta todos os cards em uma única operação — batch de DOM updates
    // múltiplos innerHTML causariam múltiplos reflows — mais lento
    document.querySelector("#app").innerHTML = cards;
}

/**
 * mostrarSkeletonPost (pública)
 * skeleton do post individual + comentários
 * post e comentários são seções independentes —
 * comentários chegam via Fetch API paralela separada
 *
 * @param {number} qtdComentarios — número de comentários skeleton — padrão 4
 */
export function mostrarSkeletonPost(qtdComentarios = 4) {
    // gera os comentários skeleton usando a função geradora privada
    const comentarios = Array.from({ length: qtdComentarios }).map(_gerarCardComentario).join("");

    // monta o post + seção de comentários independente
    // #comentarios tem id para o app.js atualizar só essa seção
    // quando os comentários chegarem via Fetch API paralela
    document.querySelector("#app").innerHTML = `
        <div class="skeleton-post__autor--individual">
            <div class="skeleton skeleton-post__avatar"></div>
            <div class="skeleton skeleton-post__nome"></div>
        </div>
        <div class="skeleton skeleton-post__titulo--completo"></div>
        <div class="skeleton skeleton-post__conteudo--completo"></div>
        <div id="comentarios">
            ${comentarios}
        </div>
    `;
}

/**
 * mostrarSkeletonFormulario (pública)
 * skeleton das rotas /postar e /comentar
 */
export function mostrarSkeletonFormulario() {
    document.querySelector("#app").innerHTML = `
        <div class="skeleton skeleton-formulario__campo"></div>
        <div class="skeleton skeleton-formulario__textarea"></div>
        <div class="skeleton skeleton-formulario__botao"></div>
    `;
}
