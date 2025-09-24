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
    const W_MAO_CHEIA = -15; // Penalidade por mão cheia

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
      // Adiciona o valor potencial com base na melhor ficha disponível no mercado
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

function gerar_jogadas_possiveis(estado_atual) {
  const jogadas_possiveis = [];
  const jogadorDaVez =
    estado_atual.turno % 2 !== 0
      ? estado_atual.jogador1
      : estado_atual.jogador2;

  // Ação 1: Comprarcarta
  if (jogadorDaVez.mao.length < 7) {
    for (let i = 0; i < estado_atual.mercado.cartas.length; i++) {
      if (estado_atual.mercado.cartas[i].tipo !== TipoCarta.VACA) {
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

  const contagemMao = {};
  jogadorDaVez.mao.forEach((c) => {
    contagemMao[c.tipo] = (contagemMao[c.tipo] || 0) + 1;
  });
  for (const tipo in contagemMao) {
    const qtdTotal = contagemMao[tipo];
    const minVenda = [
      TipoCarta.QUEIJO,
      TipoCarta.OURO,
      TipoCarta.CAFE,
    ].includes(tipo)
      ? 2
      : 1;

    for (let qtdVender = minVenda; qtdVender <= qtdTotal; qtdVender++) {
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

  for (
    let k = 2;
    k <= Math.min(cartasMercadoParaTroca.length, cartasJogadorParaTroca.length);
    k++
  ) {
    const combosMercado = gerarCombinacoes(cartasMercadoParaTroca, k);
    const combosJogador = gerarCombinacoes(cartasJogadorParaTroca, k);

    combosMercado.forEach((comboM) => {
      combosJogador.forEach((comboJ) => {
        const numCartasMaoDadas = comboJ.filter(
          (c) => c.origem === "mao"
        ).length;
        if (jogadorDaVez.mao.length - numCartasMaoDadas + k > 7) {
          return;
        }

        const novo_estado = estado_atual.clone();
        const jogador =
          novo_estado.turno % 2 !== 0
            ? novo_estado.jogador1
            : novo_estado.jogador2;

        const cartasParaJogador = comboM.map((c) => c.carta);
        const cartasParaMercado = comboJ.map((c) => c.carta);

        // Remove as cartas do mercado e da mão do jogador no novo estado
        comboM
          .map((c) => c.indice)
          .sort((a, b) => b - a)
          .forEach((i) => novo_estado.mercado.cartas.splice(i, 1));
        const indicesMao = comboJ
          .filter((c) => c.origem === "mao")
          .map((c) => c.indice)
          .sort((a, b) => b - a);
        const vacasDoadas = comboJ.filter((c) => c.origem === "vaca").length;

        indicesMao.forEach((i) => jogador.mao.splice(i, 1));
        jogador.vacas.length -= vacasDoadas;

        // Adiciona as novas cartas
        cartasParaJogador.forEach((c) => jogador.pegar_carta(c));
        cartasParaMercado.forEach((c) => novo_estado.mercado.cartas.push(c));

        novo_estado.turno++;
        jogadas_possiveis.push(novo_estado);
      });
    });
  }

  return jogadas_possiveis;
}

function minimax_alfabeta(
  estado_node,
  profundidade,
  alpha,
  beta,
  eh_jogador_max
) {
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
    return avaliar_estado(estado_node, jMax, jMin);
  }

  const proximas_jogadas = gerar_jogadas_possiveis(estado_node);

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

  proximas_jogadas.sort((a, b) => {
    const pontuacaoA = avaliar_estado(a, jogadorMaxAtual, jogadorMinAtual);
    const pontuacaoB = avaliar_estado(b, jogadorMaxAtual, jogadorMinAtual);
    return eh_jogador_max ? pontuacaoB - pontuacaoA : pontuacaoA - pontuacaoB;
  });

  if (proximas_jogadas.length === 0) {
    return eh_jogador_max ? -Infinity : Infinity;
  }

  if (eh_jogador_max) {
    let melhor_valor = -Infinity;
    for (const filho of proximas_jogadas) {
      const valor = minimax_alfabeta(
        filho,
        profundidade - 1,
        alpha,
        beta,
        false
      );
      melhor_valor = Math.max(melhor_valor, valor);
      alpha = Math.max(alpha, valor);
      if (beta <= alpha) break;
    }
    return melhor_valor;
  } else {
    let pior_valor = Infinity;
    for (const filho of proximas_jogadas) {
      const valor = minimax_alfabeta(
        filho,
        profundidade - 1,
        alpha,
        beta,
        true
      );
      pior_valor = Math.min(pior_valor, valor);
      beta = Math.min(beta, valor);
      if (beta <= alpha) break;
    }
    return pior_valor;
  }
}

function encontrar_melhor_jogada_alfabeta(estado_atual, profundidade) {
  const proximas_jogadas = gerar_jogadas_possiveis(estado_atual);
  if (proximas_jogadas.length === 0) return estado_atual;
  let melhor_jogada = proximas_jogadas[0],
    melhor_valor = -Infinity;
  for (const jogada of proximas_jogadas) {
    const valor_da_jogada = minimax_alfabeta(
      jogada,
      profundidade - 1,
      -Infinity,
      Infinity,
      false
    );
    if (valor_da_jogada > melhor_valor) {
      melhor_valor = valor_da_jogada;
      melhor_jogada = jogada;
    }
  }
  return melhor_jogada;
}
