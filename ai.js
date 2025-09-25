const cacheTransposicao = new Map();
const MAX_CACHE_SIZE = 10000;

function gerarHashEstado(estado) {
  // Gera uma chave única para o estado atual
  const j1 = estado.jogador1;
  const j2 = estado.jogador2;

  // Contagem de cartas por tipo para cada jogador
  const contJ1 = {};
  const contJ2 = {};

  j1.mao.forEach((c) => (contJ1[c.tipo] = (contJ1[c.tipo] || 0) + 1));
  j2.mao.forEach((c) => (contJ2[c.tipo] = (contJ2[c.tipo] || 0) + 1));

  // Mercado
  const mercado = estado.mercado.cartas
    .map((c) => c.tipo)
    .sort()
    .join("");

  // Hash simples
  return `${JSON.stringify(contJ1)}_${JSON.stringify(
    contJ2
  )}_${mercado}_${j1.vaca_count()}_${j2.vaca_count()}_${estado.turno % 2}`;
}

function gerarCombinacoes(arrayEntrada, tamanho) {
  const resultado = [];
  function combinar(inicio, comboAtual) {
    if (comboAtual.length === tamanho) {
      resultado.push([...comboAtual]);
      return;
    }
    for (let i = inicio; i < arrayEntrada.length; i++) {
      comboAtual.push(arrayEntrada[i]);
      combinar(i + 1, comboAtual);
      comboAtual.pop();
    }
  }
  combinar(0, []);
  return resultado;
}

function avaliar_estado(estado, jogadorMax, jogadorMin) {
  const calcular_pontuacao = (jogador, mercado) => {
    let pontuacao = 0;
    const W_FICHAS = 10;
    const W_VACAS = 3;
    const W_VALOR_POTENCIAL = 0.5;
    const W_MAO_GRANDE = 2;
    const W_MAO_CHEIA = -15;

    // Componente 1: Pontos das fichas já coletadas
    const pontosDeFichas = jogador.fichas_coletadas.reduce(
      (acc, ficha) => acc + ficha.get_valor(),
      0
    );
    pontuacao += pontosDeFichas * W_FICHAS;

    // Componente 2: Vantagem de vacas
    pontuacao += jogador.vaca_count() * W_VACAS;

    // Componente 3: Valor potencial da mão e bônus por conjuntos
    let contagemMao = {};
    jogador.mao.forEach((carta) => {
      contagemMao[carta.tipo] = (contagemMao[carta.tipo] || 0) + 1;
      if (mercado.fichas[carta.tipo] && mercado.fichas[carta.tipo].length > 0) {
        const melhorFichaValor =
          mercado.fichas[carta.tipo][
            mercado.fichas[carta.tipo].length - 1
          ].get_valor();
        pontuacao += melhorFichaValor * W_VALOR_POTENCIAL;
      }
    });

    for (const tipo in contagemMao) {
      if (contagemMao[tipo] >= 3) pontuacao += contagemMao[tipo] * W_MAO_GRANDE;
    }

    // Componente 4: Penalidade por mão cheia
    if (jogador.mao.length >= 7) {
      pontuacao += W_MAO_CHEIA;
    }

    return pontuacao;
  };

  const pontuacaoMax = calcular_pontuacao(jogadorMax, estado.mercado);
  const pontuacaoMin = calcular_pontuacao(jogadorMin, estado.mercado);

  return pontuacaoMax - pontuacaoMin;
}

function gerar_jogadas_possiveis(
  estado_atual,
  dificuldade,
  profundidade_restante
) {
  const jogadas_possiveis = [];
  const jogadorDaVez =
    estado_atual.turno % 2 !== 0
      ? estado_atual.jogador1
      : estado_atual.jogador2;

  // PODA 1: limitar ações complexas dependendo da profundidade
  const limitarAcoes = profundidade_restante <= 1;

  // Ação 1: Comprar carta
  if (jogadorDaVez.mao.length < 7) {
    const cartasMercado = estado_atual.mercado.cartas;

    const limite = limitarAcoes
      ? Math.min(3, cartasMercado.length)
      : cartasMercado.length;

    for (let i = 0; i < limite; i++) {
      if (cartasMercado[i].tipo !== TipoCarta.VACA) {
        const novo_estado = estado_atual.clone();
        const jogador =
          novo_estado.turno % 2 !== 0
            ? novo_estado.jogador1
            : novo_estado.jogador2;
        const carta = novo_estado.mercado.cartas.splice(i, 1)[0];
        jogador.pegar_carta(carta);
        novo_estado.mercado.repor(novo_estado.baralho);
        novo_estado.turno++;
        jogadas_possiveis.push(novo_estado);
      }
    }
  }

  // Ação 2: Pegar TODAS as vacas
  if (estado_atual.mercado.cartas.some((c) => c.tipo === TipoCarta.VACA)) {
    const novo_estado = estado_atual.clone();
    const jogador =
      novo_estado.turno % 2 !== 0 ? novo_estado.jogador1 : novo_estado.jogador2;
    const vacasPegas = [];
    novo_estado.mercado.cartas = novo_estado.mercado.cartas.filter((c) => {
      if (c.tipo === TipoCarta.VACA) {
        vacasPegas.push(c);
        return false;
      }
      return true;
    });
    vacasPegas.forEach((c) => jogador.pegar_carta(c));
    novo_estado.mercado.repor(novo_estado.baralho);
    novo_estado.turno++;
    jogadas_possiveis.push(novo_estado);
  }

  // Ação 3: Vender mercadorias
  const contagemMao = {};
  jogadorDaVez.mao.forEach((c) => {
    contagemMao[c.tipo] = (contagemMao[c.tipo] || 0) + 1;
  });

  // PODA 2: Em profundidades baixas, só considerar vendas ótimas
  for (const tipo in contagemMao) {
    const qtdTotal = contagemMao[tipo];
    const minVenda = [
      TipoCarta.QUEIJO,
      TipoCarta.OURO,
      TipoCarta.CAFE,
    ].includes(tipo)
      ? 2
      : 1;

    const vendasConsiderar = limitarAcoes
      ? [qtdTotal, Math.max(3, minVenda)].filter(
          (q) => q >= minVenda && q <= qtdTotal
        )
      : Array.from({ length: qtdTotal - minVenda + 1 }, (_, i) => i + minVenda);

    for (const qtdVender of vendasConsiderar) {
      const novo_estado = estado_atual.clone();
      const jogador =
        novo_estado.turno % 2 !== 0
          ? novo_estado.jogador1
          : novo_estado.jogador2;
      if (jogador.vender_mercadorias(novo_estado.mercado, tipo, qtdVender)) {
        novo_estado.turno++;
        jogadas_possiveis.push(novo_estado);
      }
    }
  }

  // PODA 3: Limitar trocas drasticamente em profundidades baixas
  if (!limitarAcoes || profundidade_restante > 2) {
    const LIMITE_TROCA = limitarAcoes ? 2 : 3;
    const MAX_COMBOS_POR_TAMANHO = 10; // Limitar combinações

    const cartasMercadoParaTroca = [];
    estado_atual.mercado.cartas.forEach((carta, indice) => {
      if (carta.tipo !== TipoCarta.VACA) {
        cartasMercadoParaTroca.push({ carta, indice });
      }
    });

    const cartasJogadorParaTroca = [];
    jogadorDaVez.mao.forEach((carta, indice) =>
      cartasJogadorParaTroca.push({ carta, indice, origem: "mao" })
    );
    for (let i = 0; i < jogadorDaVez.vaca_count(); i++) {
      cartasJogadorParaTroca.push({
        carta: new Carta(TipoCarta.VACA),
        indice: i,
        origem: "vaca",
      });
    }

    const VALORES_HEURISTICOS = {
      QUEIJO: 8,
      OURO: 7,
      CAFE: 6,
      LEITE: 4,
      DOCE_DE_LEITE: 4,
      BATATA: 3,
      VACA: 1,
    };

    // Só considerar trocas de tamanho 2 nas dificuldades baixas
    const tamanhoMax = Math.min(
      cartasMercadoParaTroca.length,
      cartasJogadorParaTroca.length,
      LIMITE_TROCA
    );
    const tamanhoMin = limitarAcoes ? Math.min(2, tamanhoMax) : 2;

    for (let k = tamanhoMin; k <= tamanhoMax; k++) {
      let combosMercado = gerarCombinacoes(cartasMercadoParaTroca, k);
      let combosJogador = gerarCombinacoes(cartasJogadorParaTroca, k);

      // PODA 4: Limitar número de combinações consideradas
      if (combosMercado.length > MAX_COMBOS_POR_TAMANHO) {
        // Ordenar por valor e pegar apenas as melhores
        combosMercado = combosMercado
          .map((combo) => ({
            combo,
            valor: combo.reduce(
              (acc, c) => acc + VALORES_HEURISTICOS[c.carta.tipo],
              0
            ),
          }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, MAX_COMBOS_POR_TAMANHO)
          .map((item) => item.combo);
      }

      if (combosJogador.length > MAX_COMBOS_POR_TAMANHO) {
        combosJogador = combosJogador.slice(0, MAX_COMBOS_POR_TAMANHO);
      }

      combosMercado.forEach((comboM) => {
        const valorRecebido = comboM.reduce(
          (acc, c) => acc + VALORES_HEURISTICOS[c.carta.tipo],
          0
        );

        // Só considerar as 5 melhores trocas para cada combo do mercado
        let trocasValidas = [];

        combosJogador.forEach((comboJ) => {
          const valorDado = comboJ.reduce(
            (acc, c) => acc + VALORES_HEURISTICOS[c.carta.tipo],
            0
          );

          const fatorDeMelhora = limitarAcoes ? 1.5 : 1.2;
          if (valorRecebido < valorDado * fatorDeMelhora) {
            return;
          }

          const numCartasMaoDadas = comboJ.filter(
            (c) => c.origem === "mao"
          ).length;
          if (jogadorDaVez.mao.length - numCartasMaoDadas + k > 7) {
            return;
          }

          trocasValidas.push({ comboJ, valorGanho: valorRecebido - valorDado });
        });

        // Ordenar e pegar apenas as 3 melhores trocas
        trocasValidas
          .sort((a, b) => b.valorGanho - a.valorGanho)
          .slice(0, 3)
          .forEach(({ comboJ }) => {
            const novo_estado = estado_atual.clone();
            const jogador =
              novo_estado.turno % 2 !== 0
                ? novo_estado.jogador1
                : novo_estado.jogador2;

            const cartasParaJogador = comboM.map((c) => c.carta);
            const cartasParaMercado = comboJ.map((c) => c.carta);

            comboM
              .map((c) => c.indice)
              .sort((a, b) => b - a)
              .forEach((i) => novo_estado.mercado.cartas.splice(i, 1));
            const indicesMao = comboJ
              .filter((c) => c.origem === "mao")
              .map((c) => c.indice)
              .sort((a, b) => b - a);
            const vacasDoadas = comboJ.filter(
              (c) => c.origem === "vaca"
            ).length;
            indicesMao.forEach((i) => jogador.mao.splice(i, 1));
            jogador.vacas.length -= vacasDoadas;
            cartasParaJogador.forEach((c) => jogador.pegar_carta(c));
            cartasParaMercado.forEach((c) =>
              novo_estado.mercado.cartas.push(c)
            );
            novo_estado.turno++;
            jogadas_possiveis.push(novo_estado);
          });
      });
    }
  }

  return jogadas_possiveis;
}

function minimax_alfabeta(
  estado_node,
  profundidade,
  alpha,
  beta,
  eh_jogador_max,
  dificuldade
) {
  // Verificar cache de transposição
  const hashEstado = gerarHashEstado(estado_node);
  const entradaCache = cacheTransposicao.get(hashEstado);

  if (entradaCache && entradaCache.profundidade >= profundidade) {
    return entradaCache.valor;
  }

  if (
    profundidade === 0 ||
    estado_node.mercado.tres_pilhas_vazias() ||
    estado_node.baralho.vazio()
  ) {
    const jMax = eh_jogador_max
      ? estado_node.turno % 2 !== 0
        ? estado_node.jogador1
        : estado_node.jogador2
      : estado_node.turno % 2 !== 0
      ? estado_node.jogador2
      : estado_node.jogador1;
    const jMin = eh_jogador_max
      ? estado_node.turno % 2 !== 0
        ? estado_node.jogador2
        : estado_node.jogador1
      : estado_node.turno % 2 !== 0
      ? estado_node.jogador1
      : estado_node.jogador2;

    const valor = avaliar_estado(estado_node, jMax, jMin);

    // Guardar no cache
    if (cacheTransposicao.size > MAX_CACHE_SIZE) {
      // Limpar cache quando ficar grande
      const keysToDelete = Array.from(cacheTransposicao.keys()).slice(
        0,
        MAX_CACHE_SIZE / 2
      );
      keysToDelete.forEach((key) => cacheTransposicao.delete(key));
    }
    cacheTransposicao.set(hashEstado, { valor, profundidade });

    return valor;
  }

  const proximas_jogadas = gerar_jogadas_possiveis(
    estado_node,
    dificuldade,
    profundidade
  );

  if (proximas_jogadas.length === 0) {
    return eh_jogador_max ? -Infinity : Infinity;
  }

  // Ordenação heurística
  const jogadorMaxAtual = eh_jogador_max
    ? estado_node.turno % 2 !== 0
      ? estado_node.jogador1
      : estado_node.jogador2
    : estado_node.turno % 2 !== 0
    ? estado_node.jogador2
    : estado_node.jogador1;
  const jogadorMinAtual = eh_jogador_max
    ? estado_node.turno % 2 !== 0
      ? estado_node.jogador2
      : estado_node.jogador1
    : estado_node.turno % 2 !== 0
    ? estado_node.jogador1
    : estado_node.jogador2;

  // PODA 5: rofundidades baixas, considerar apenas as melhores jogadas
  let jogadasParaAvaliar = proximas_jogadas;
  if (profundidade <= 2 && proximas_jogadas.length > 15) {
    jogadasParaAvaliar = proximas_jogadas
      .map((jogada) => ({
        jogada,
        valor: avaliar_estado(jogada, jogadorMaxAtual, jogadorMinAtual),
      }))
      .sort((a, b) => (eh_jogador_max ? b.valor - a.valor : a.valor - b.valor))
      .slice(0, 15)
      .map((item) => item.jogada);
  } else {
    jogadasParaAvaliar.sort((a, b) => {
      const pontuacaoA = avaliar_estado(a, jogadorMaxAtual, jogadorMinAtual);
      const pontuacaoB = avaliar_estado(b, jogadorMaxAtual, jogadorMinAtual);
      return eh_jogador_max ? pontuacaoB - pontuacaoA : pontuacaoA - pontuacaoB;
    });
  }

  let resultadoValor;

  if (eh_jogador_max) {
    let melhor_valor = -Infinity;
    for (const filho of jogadasParaAvaliar) {
      const valor = minimax_alfabeta(
        filho,
        profundidade - 1,
        alpha,
        beta,
        false,
        dificuldade
      );
      melhor_valor = Math.max(melhor_valor, valor);
      alpha = Math.max(alpha, valor);
      if (beta <= alpha) break;
    }
    resultadoValor = melhor_valor;
  } else {
    let pior_valor = Infinity;
    for (const filho of jogadasParaAvaliar) {
      const valor = minimax_alfabeta(
        filho,
        profundidade - 1,
        alpha,
        beta,
        true,
        dificuldade
      );
      pior_valor = Math.min(pior_valor, valor);
      beta = Math.min(beta, valor);
      if (beta <= alpha) break;
    }
    resultadoValor = pior_valor;
  }

  // Guardar no cache
  cacheTransposicao.set(hashEstado, { valor: resultadoValor, profundidade });

  return resultadoValor;
}

function encontrar_melhor_jogada_alfabeta(
  estado_atual,
  profundidade,
  dificuldade
) {
  // Limpar cache periodicamente
  if (cacheTransposicao.size > MAX_CACHE_SIZE * 1.5) {
    cacheTransposicao.clear();
  }

  const proximas_jogadas = gerar_jogadas_possiveis(
    estado_atual,
    dificuldade,
    profundidade
  );
  if (proximas_jogadas.length === 0) return estado_atual;

  const jogadorMax =
    estado_atual.turno % 2 !== 0
      ? estado_atual.jogador1
      : estado_atual.jogador2;
  const jogadorMin =
    estado_atual.turno % 2 !== 0
      ? estado_atual.jogador2
      : estado_atual.jogador1;

  // Pré-avaliar e ordenar jogadas
  const jogadasComValor = proximas_jogadas.map((jogada) => ({
    jogada,
    valorHeuristico: avaliar_estado(jogada, jogadorMax, jogadorMin),
  }));

  jogadasComValor.sort((a, b) => b.valorHeuristico - a.valorHeuristico);

  // PODA 6: profundidade 4
  let jogadasParaAvaliar = jogadasComValor;
  if (profundidade >= 4 && jogadasComValor.length > 10) {
    jogadasParaAvaliar = jogadasComValor.slice(0, 10);
  } else if (profundidade >= 3 && jogadasComValor.length > 15) {
    jogadasParaAvaliar = jogadasComValor.slice(0, 15);
  }

  let melhor_jogada = jogadasParaAvaliar[0].jogada;
  let melhor_valor = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const { jogada } of jogadasParaAvaliar) {
    const valor_da_jogada = minimax_alfabeta(
      jogada,
      profundidade - 1,
      alpha,
      beta,
      false,
      dificuldade
    );
    if (valor_da_jogada > melhor_valor) {
      melhor_valor = valor_da_jogada;
      melhor_jogada = jogada;
    }
    alpha = Math.max(alpha, melhor_valor);

    // Corte antecipado
    if (profundidade >= 4 && melhor_valor > 100) {
      break;
    }
  }

  return melhor_jogada;
}
