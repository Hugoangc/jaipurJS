let estadoAtual, PROFUNDIDADE_IA;
let NOME_DIFICULDADE_IA = "";
let selecao = { mao: [], mercado: [], cameloCount: 0 };
let historicoRodadas = [];
let jogador1 = new Jogador("Você");
let jogador2 = new Jogador("Oponente IA");

const CARTA_VISUALS = {
  DIAMANTE: { icon: "💎", name: "Diamante" },
  OURO: { icon: "🥇", name: "Ouro" },
  PRATA: { icon: "🥈", name: "Prata" },
  SEDA: { icon: "🧣", name: "Seda" },
  ESPECIA: { icon: "🌶️", name: "Especiaria" },
  COURO: { icon: "👜", name: "Couro" },
  CAMELO: { icon: "🐫", name: "Camelo" },
  VERSO: { icon: " J ", name: "Jaipur" },
};
const VALORES_BASE = {
  DIAMANTE: 7,
  OURO: 6,
  PRATA: 5,
  SEDA: 3,
  ESPECIA: 3,
  COURO: 1,
};

const get = (id) => document.getElementById(id);
const j1NomeEl = get("j1-nome"),
  j1FichasEl = get("j1-fichas"),
  j1CamelosEl = get("j1-camelos"),
  j1SelosEl = get("j1-selos"),
  j1MaoEl = get("j1-mao");
const j2NomeEl = get("j2-nome"),
  j2FichasEl = get("j2-fichas"),
  j2CamelosEl = get("j2-camelos"),
  j2SelosEl = get("j2-selos"),
  j2MaoEl = get("j2-mao");
const mercadoCartasEl = get("mercado-cartas"),
  cartasBaralhoEl = get("cartas-baralho"),
  turnoAtualEl = get("turno-atual"),
  notificationTextEl = get("notification-text");
const placarMd3El = get("placar-md3");
const dificuldadeJogoEl = get("dificuldade-jogo");
const tabelaValoresEl = get("tabela-valores");
const tradeIndicatorEl = get("trade-indicator");
const btnVender = get("btn-vender"),
  btnTrocar = get("btn-trocar"),
  btnPegarCamelos = get("btn-pegar-camelos"),
  btnDesistir = get("btn-desistir");
const modalDificuldade = get("modal-dificuldade");
const modalFimDeJogo = get("modal-fim-de-jogo");
const vencedorFinalEl = get("vencedor-final");
const detalhesRodadasEl = get("detalhes-rodadas");
const btnJogarNovamente = get("btn-jogar-novamente");
const modalRegras = get("modal-regras");
const btnRegras = get("btn-regras");
const btnFecharRegras = get("btn-fechar-regras");

function notificar(mensagem) {
  notificationTextEl.textContent = mensagem;
}

function criarElementoCarta(carta, indice, origem) {
  const cartaEl = document.createElement("div");
  cartaEl.classList.add("card");
  cartaEl.dataset.tipo = carta.tipo;
  cartaEl.dataset.indice = indice;
  cartaEl.dataset.origem = origem;
  const visual = CARTA_VISUALS[carta.tipo];
  if (visual)
    cartaEl.innerHTML = `<span class="card-icon">${visual.icon}</span><span class="card-name">${visual.name}</span>`;
  if (carta.tipo === "VERSO") cartaEl.classList.add("verso");
  if (origem === "mao" || origem === "mercado") {
    cartaEl.addEventListener("click", () => onCartaClick(cartaEl));
  }
  return cartaEl;
}

function renderizarTabelaFixa() {
  tabelaValoresEl.innerHTML = "";
  for (const tipo in VALORES_BASE) {
    const valorItemEl = document.createElement("div");
    valorItemEl.className = "valor-item";
    const visual = CARTA_VISUALS[tipo];
    if (visual) {
      valorItemEl.innerHTML = `<span class="valor-item-icon">${visual.icon}</span><span class="valor-item-ponto">${VALORES_BASE[tipo]}</span>`;
      tabelaValoresEl.appendChild(valorItemEl);
    }
  }
}

function onCamelStackRightClick(event) {
  event.preventDefault();
  if (selecao.cameloCount > 0) {
    selecao.cameloCount--;
    atualizarIndicadorTroca();
  }
}
function renderizar() {
  const j1 = estadoAtual.jogador1,
    j2 = estadoAtual.jogador2;

  placarMd3El.textContent = `${j1.selos_excelencia} a ${j2.selos_excelencia}`;
  dificuldadeJogoEl.textContent = NOME_DIFICULDADE_IA;

  j1NomeEl.textContent = j1.nome;
  j1FichasEl.textContent = j1.fichas_coletadas.length;
  j1CamelosEl.textContent = j1.camelo_count();
  j1SelosEl.textContent = j1.selos_excelencia;
  j1MaoEl.innerHTML = "";
  j1.mao.forEach((carta, i) =>
    j1MaoEl.appendChild(criarElementoCarta(carta, i, "mao"))
  );

  if (j1.camelo_count() > 0) {
    const stack = document.createElement("div");
    stack.className = "camel-stack";
    stack.dataset.count = j1.camelo_count();

    for (let i = 0; i < j1.camelo_count(); i++) {
      stack.appendChild(
        criarElementoCarta(new Carta(TipoCarta.CAMELO), i, "camelo")
      );
    }

    stack.addEventListener("click", onCamelStackClick);
    stack.addEventListener("contextmenu", onCamelStackRightClick);

    j1MaoEl.appendChild(stack);
  }

  j2NomeEl.textContent = j2.nome;
  j2FichasEl.textContent = j2.fichas_coletadas.length;
  j2CamelosEl.textContent = j2.camelo_count();
  j2SelosEl.textContent = j2.selos_excelencia;
  j2MaoEl.innerHTML = "";
  for (let i = 0; i < j2.mao.length; i++)
    j2MaoEl.appendChild(criarElementoCarta(new Carta("VERSO"), i, "oponente"));
  if (j2.camelo_count() > 0) {
    const stack = document.createElement("div");
    stack.className = "camel-stack";
    stack.dataset.count = j2.camelo_count();
    for (let i = 0; i < j2.camelo_count(); i++)
      stack.appendChild(
        criarElementoCarta(new Carta(TipoCarta.CAMELO), i, "oponente-camelo")
      );
    j2MaoEl.appendChild(stack);
  }

  mercadoCartasEl.innerHTML = "";
  estadoAtual.mercado.cartas.forEach((carta, i) =>
    mercadoCartasEl.appendChild(criarElementoCarta(carta, i, "mercado"))
  );
  cartasBaralhoEl.textContent = estadoAtual.baralho.cartas.length;
  turnoAtualEl.textContent = estadoAtual.turno;

  limparSelecao();
}

document.addEventListener("DOMContentLoaded", () => {
  btnVender.addEventListener("click", onVenderClick);
  btnTrocar.addEventListener("click", onTrocarClick);
  btnPegarCamelos.addEventListener("click", onPegarCamelosClick);
  btnDesistir.addEventListener("click", onDesistirClick);

  btnJogarNovamente.addEventListener("click", () => location.reload());
  btnRegras.addEventListener("click", () => {
    modalRegras.style.display = "flex";
  });

  btnFecharRegras.addEventListener("click", () => {
    modalRegras.style.display = "none";
  });
  modalRegras.addEventListener("click", (event) => {
    if (event.target === modalRegras) {
      modalRegras.style.display = "none";
    }
  });
  document
    .querySelectorAll("#modal-dificuldade .modal-buttons button")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        PROFUNDIDADE_IA = parseInt(btn.dataset.depth);
        NOME_DIFICULDADE_IA = btn.textContent;
        modalDificuldade.style.display = "none";
        renderizarTabelaFixa();
        iniciarJogo();
      });
    });
});
function limparSelecao() {
  selecao = { mao: [], mercado: [], cameloCount: 0 };
  document
    .querySelectorAll(".card.selected")
    .forEach((c) => c.classList.remove("selected"));
  atualizarIndicadorTroca();
}

function onCartaClick(cartaEl) {
  const origem = cartaEl.dataset.origem;
  if (!["mao", "mercado"].includes(origem)) return;

  const indice = parseInt(cartaEl.dataset.indice);
  const j1 = estadoAtual.jogador1;
  if (
    origem === "mercado" &&
    selecao.mao.length === 0 &&
    selecao.cameloCount === 0 &&
    selecao.mercado.length === 0
  ) {
    const cartaComprada = estadoAtual.mercado.cartas[indice];
    if (cartaComprada.tipo === TipoCarta.CAMELO)
      return notificar("Para pegar camelos, use o botão 'Pegar Camelos'.");
    if (j1.mao.length >= 7)
      return notificar("Sua mão está cheia (limite de 7 cartas).");
    j1.pegar_carta(estadoAtual.mercado.cartas.splice(indice, 1)[0]);
    estadoAtual.mercado.repor(estadoAtual.baralho);
    proximoTurno(`Você comprou ${cartaComprada.tipo}.`);
    return;
  }

  cartaEl.classList.toggle("selected");
  const listaSelecao = selecao[origem];
  const pos = listaSelecao.indexOf(indice);
  if (pos > -1) {
    listaSelecao.splice(pos, 1);
  } else {
    listaSelecao.push(indice);
  }
  atualizarIndicadorTroca();
}
function onCamelStackClick(event) {
  event.preventDefault();
  const totalCamelos = estadoAtual.jogador1.camelo_count();
  if (totalCamelos === 0) {
    return;
  }
  if (selecao.cameloCount < totalCamelos) {
    selecao.cameloCount++;
  } else {
    selecao.cameloCount = 0;
  }
  atualizarIndicadorTroca();
}

function onCamelStackRightClick(event) {
  event.preventDefault();
  if (selecao.cameloCount > 0) {
    selecao.cameloCount--;
    atualizarIndicadorTroca();
  }
}
function atualizarIndicadorTroca() {
  const { mao, mercado, cameloCount } = selecao;

  tradeIndicatorEl.innerHTML = "";

  if (mao.length === 0 && mercado.length === 0 && cameloCount === 0) {
    return;
  }

  let texto = "<span>Seleção para troca: </span>";
  const partes = [];

  if (cameloCount > 0) {
    partes.push(`<span id="camel-trade-indicator" class="trade-item" title="Clique para remover um camelo">
                    🐫 ${cameloCount} Camelo(s)
                 </span>`);
  }
  if (mao.length > 0)
    partes.push(`<span class="trade-item">✋ ${mao.length} da mão</span>`);
  if (mercado.length > 0)
    partes.push(
      `<span class="trade-item">🛒 ${mercado.length} do mercado</span>`
    );

  tradeIndicatorEl.innerHTML = texto + partes.join(" + ");

  const camelIndicator = get("camel-trade-indicator");
  if (camelIndicator) {
    camelIndicator.addEventListener("click", () => {
      if (selecao.cameloCount > 0) {
        selecao.cameloCount--;
        atualizarIndicadorTroca();
      }
    });
  }
}

function onPegarCamelosClick() {
  const j1 = estadoAtual.jogador1;
  let camelosNoMercado = 0;
  const novasCartasMercado = estadoAtual.mercado.cartas.filter((carta) => {
    if (carta.tipo === TipoCarta.CAMELO) {
      j1.pegar_carta(carta);
      camelosNoMercado++;
      return false;
    }
    return true;
  });
  if (camelosNoMercado > 0) {
    estadoAtual.mercado.cartas = novasCartasMercado;
    estadoAtual.mercado.repor(estadoAtual.baralho);
    proximoTurno(`Você pegou ${camelosNoMercado} camelo(s).`);
  } else notificar("Não há camelos no mercado.");
}

function onVenderClick() {
  if (selecao.mao.length === 0)
    return notificar("Selecione cartas da sua mão para vender.");
  const j1 = estadoAtual.jogador1;
  const tipoParaVender = j1.mao[selecao.mao[0]].tipo;
  if (selecao.mao.some((indice) => j1.mao[indice].tipo !== tipoParaVender))
    return notificar("Você só pode vender cartas do mesmo tipo de uma vez.");
  const quantidade = selecao.mao.length;
  const sucesso = j1.vender_mercadorias(
    estadoAtual.mercado,
    tipoParaVender,
    quantidade
  );
  if (sucesso) {
    proximoTurno(
      `Você vendeu ${quantidade} ${tipoParaVender} e coletou as fichas.`
    );
  } else {
    notificar(
      "Venda inválida! (Lembre-se: bens de luxo 💎🥇🥈 exigem no mínimo 2 cartas)."
    );
    limparSelecao();
  }
}

function onTrocarClick() {
  const j1 = estadoAtual.jogador1;
  const cartasDoJogadorCount = selecao.mao.length + selecao.cameloCount;
  const cartasMercadoSel = selecao.mercado.map(
    (i) => estadoAtual.mercado.cartas[i]
  );

  if (cartasDoJogadorCount === 0 && cartasMercadoSel.length === 0) {
    return notificar("Selecione cartas para trocar.");
  }

  if (cartasDoJogadorCount !== cartasMercadoSel.length) {
    return notificar(
      "Para trocar, selecione o mesmo número de cartas da sua mão/camelos e do mercado."
    );
  }

  if (cartasMercadoSel.some((c) => c.tipo === TipoCarta.CAMELO))
    return notificar("Você não pode pegar camelos em uma troca.");

  const maoAtual = j1.mao.length;
  const cartasDadas = selecao.mao.length;
  const cartasRecebidas = selecao.mercado.length;
  const maoFinal = maoAtual - cartasDadas + cartasRecebidas;

  if (maoFinal > 7) {
    return notificar(
      `Troca inválida! Sua mão ficaria com ${maoFinal} cartas (limite de 7).`
    );
  }

  const indMao = selecao.mao.sort((a, b) => b - a),
    indMercado = selecao.mercado.sort((a, b) => b - a);
  const paraMercado = [],
    paraMao = [];
  indMao.forEach((i) => paraMercado.push(j1.mao.splice(i, 1)[0]));
  for (let i = 0; i < selecao.cameloCount; i++) {
    paraMercado.push(j1.camelos.pop());
  }
  indMercado.forEach((i) =>
    paraMao.push(estadoAtual.mercado.cartas.splice(i, 1)[0])
  );
  paraMao.forEach((c) => j1.pegar_carta(c));
  paraMercado.forEach((c) => estadoAtual.mercado.cartas.push(c));
  proximoTurno(`Você trocou ${paraMercado.length} carta(s).`);
}

function onDesistirClick() {
  notificar(
    "Você desistiu da rodada. O oponente recebe um Selo de Excelência."
  );

  const resumoRodada = {
    rodada: historicoRodadas.length + 1,
    placarJ1: "Desistência",
    placarJ2: "Vitória",
    vencedor: estadoAtual.jogador2.nome,
  };
  historicoRodadas.push(resumoRodada);

  estadoAtual.jogador2.selos_excelencia++;
  document.body.style.pointerEvents = "none";

  setTimeout(() => {
    renderizar();
    if (estadoAtual.jogador2.selos_excelencia === 2) {
      exibirResumoFinalDoJogo();
    } else {
      iniciarNovaRodada();
    }
  }, 2000);
}

function proximoTurno(mensagem) {
  notificar(mensagem);
  renderizar();
  if (verificarFimDeRodada()) {
    fimDeRodada();
  } else {
    estadoAtual.turno++;
    if (estadoAtual.turno % 2 === 0) {
      document.body.style.pointerEvents = "none";
      notificar("Oponente está pensando...");
      setTimeout(() => {
        const cloneEstado = estadoAtual.clone();
        const melhorJogada = encontrar_melhor_jogada_alfabeta(
          cloneEstado,
          PROFUNDIDADE_IA
        );
        estadoAtual = melhorJogada;
        notificar("Oponente jogou. É a sua vez.");
        if (verificarFimDeRodada()) {
          fimDeRodada();
        } else {
          document.body.style.pointerEvents = "auto";
          renderizar();
        }
      }, 500);
    }
  }
}

function verificarFimDeRodada() {
  return (
    estadoAtual.baralho.vazio() || estadoAtual.mercado.tres_pilhas_vazias()
  );
}
function fimDeRodada() {
  document.body.style.pointerEvents = "none";
  const j1 = estadoAtual.jogador1;
  const j2 = estadoAtual.jogador2;

  let pontosCamelosJ1 = j1.camelo_count() > j2.camelo_count() ? 5 : 0;
  let pontosCamelosJ2 = j2.camelo_count() > j1.camelo_count() ? 5 : 0;

  j1.pontos_rodada = j1.calcular_pontos_rodada() + pontosCamelosJ1;
  j2.pontos_rodada = j2.calcular_pontos_rodada() + pontosCamelosJ2;

  let vencedorMsg = `Empate na rodada!`;
  if (j1.pontos_rodada > j2.pontos_rodada) {
    j1.selos_excelencia++;
    vencedorMsg = `${j1.nome} vence a rodada!`;
  } else if (j2.pontos_rodada > j1.pontos_rodada) {
    j2.selos_excelencia++;
    vencedorMsg = `${j2.nome} vence a rodada!`;
  }

  historicoRodadas.push({
    rodada: historicoRodadas.length + 1,
    placarJ1: j1.pontos_rodada,
    placarJ2: j2.pontos_rodada,
  });

  renderizar();
  notificar(
    `FIM DA RODADA! Placar Final: Você ${j1.pontos_rodada} x ${j2.pontos_rodada} Oponente.`
  );

  setTimeout(() => {
    if (j1.selos_excelencia === 2 || j2.selos_excelencia === 2) {
      exibirResumoFinalDoJogo();
    } else {
      notificar(`${vencedorMsg} Clique em 'Próxima Rodada' para continuar.`);
      btnPegarCamelos.textContent = "Próxima Rodada";
      btnPegarCamelos.onclick = iniciarNovaRodada;
      btnVender.style.display = "none";
      btnTrocar.style.display = "none";
      btnDesistir.style.display = "none";
      document.body.style.pointerEvents = "auto";
    }
  }, 4000);
}

function exibirResumoFinalDoJogo() {
  document.body.style.pointerEvents = "auto";

  const j1 = estadoAtual.jogador1;
  const j2 = estadoAtual.jogador2;
  const vencedorFinal = j1.selos_excelencia === 2 ? j1.nome : j2.nome;

  vencedorFinalEl.textContent = `${vencedorFinal} é o grande vencedor!`;

  detalhesRodadasEl.innerHTML = `
        <div class="rodada-resumo rodada-header">
            <div>Rodada</div>
            <div>${j1.nome}</div>
            <div>${j2.nome}</div>
        </div>
    `;

  historicoRodadas.forEach((resumo) => {
    const linha = document.createElement("div");
    linha.className = "rodada-resumo";
    linha.innerHTML = `
            <div>${resumo.rodada}</div>
            <div>${resumo.placarJ1}</div>
            <div>${resumo.placarJ2}</div>
        `;
    detalhesRodadasEl.appendChild(linha);
  });

  modalFimDeJogo.style.display = "flex";
}

function iniciarNovaRodada() {
  btnPegarCamelos.textContent = "Pegar Camelos";
  btnPegarCamelos.onclick = onPegarCamelosClick;
  btnVender.style.display = "inline-block";
  btnTrocar.style.display = "inline-block";
  btnDesistir.style.display = "inline-block";
  iniciarJogo();
}

function iniciarJogo() {
  if (estadoAtual) {
    jogador1.selos_excelencia = estadoAtual.jogador1.selos_excelencia;
    jogador2.selos_excelencia = estadoAtual.jogador2.selos_excelencia;
  }

  jogador1.resetarParaNovaRodada();
  jogador2.resetarParaNovaRodada();

  const baralho = new Baralho();
  const mercado = new Mercado();
  mercado.inicializar(baralho);

  for (let i = 0; i < 5; i++) {
    jogador1.pegar_carta(baralho.comprar());
    jogador2.pegar_carta(baralho.comprar());
  }

  estadoAtual = new EstadoJogo(jogador1, jogador2, baralho, mercado, 1);

  if (jogador1.selos_excelencia === 0 && jogador2.selos_excelencia === 0) {
    historicoRodadas = [];
  }

  renderizar();
  notificar("Nova rodada começou. É a sua vez.");
  document.body.style.pointerEvents = "auto";
}
