const TipoCarta = Object.freeze({
  QUEIJO: "QUEIJO",
  OURO: "OURO",
  CAFE: "CAFE",
  LEITE: "LEITE",
  DOCE_DE_LEITE: "DOCE_DE_LEITE",
  BATATA: "BATATA",
  VACA: "VACA",
});

class Carta {
  constructor(tipo) {
    this.tipo = tipo;
  }
}

class Ficha {
  constructor(valor) {
    this.valor = valor;
  }
  get_valor() {
    return this.valor;
  }
}

class Baralho {
  constructor() {
    this.cartas = [];
    this.inicializar();
    this.embaralhar();
  }
  inicializar() {
    const contagem = {
      [TipoCarta.QUEIJO]: 6,
      [TipoCarta.OURO]: 6,
      [TipoCarta.CAFE]: 6,
      [TipoCarta.LEITE]: 8,
      [TipoCarta.DOCE_DE_LEITE]: 8,
      [TipoCarta.BATATA]: 10,
      [TipoCarta.VACA]: 11,
    };
    for (const tipo in contagem) {
      for (let i = 0; i < contagem[tipo]; i++)
        this.cartas.push(new Carta(tipo));
    }
  }
  embaralhar() {
    for (let i = this.cartas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
    }
  }
  comprar() {
    return this.cartas.pop();
  }
  vazio() {
    return this.cartas.length === 0;
  }
  clone() {
    const novo = new Baralho();
    novo.cartas = this.cartas.map((c) => new Carta(c.tipo));
    return novo;
  }
}

class Mercado {
  constructor() {
    this.cartas = [];
    this.fichas = {};
    this.bonus3 = [];
    this.bonus4 = [];
    this.bonus5 = [];
    this.inicializar_fichas();
  }

  inicializar_fichas() {
    this.fichas = {
      [TipoCarta.QUEIJO]: [7, 7, 5, 5, 5].map((v) => new Ficha(v)),
      [TipoCarta.OURO]: [6, 6, 5, 5, 5].map((v) => new Ficha(v)),
      [TipoCarta.CAFE]: [5, 5, 5, 5, 5].map((v) => new Ficha(v)),
      [TipoCarta.LEITE]: [5, 3, 3, 2, 2, 1, 1].map((v) => new Ficha(v)),
      [TipoCarta.DOCE_DE_LEITE]: [5, 3, 3, 2, 2, 1, 1].map((v) => new Ficha(v)),
      [TipoCarta.BATATA]: [4, 3, 2, 1, 1, 1, 1, 1, 1].map((v) => new Ficha(v)),
    };

    const bonus3Val = [1, 2, 3, 2, 1, 3];
    const bonus4Val = [4, 5, 6, 6, 5, 4];
    const bonus5Val = [10, 10, 9, 8, 8, 9];

    this.bonus3 = bonus3Val
      .sort(() => 0.5 - Math.random())
      .map((v) => new Ficha(v));
    this.bonus4 = bonus4Val
      .sort(() => 0.5 - Math.random())
      .map((v) => new Ficha(v));
    this.bonus5 = bonus5Val
      .sort(() => 0.5 - Math.random())
      .map((v) => new Ficha(v));
  }

  inicializar(baralho) {
    for (let i = 0; i < 3; i++) {
      this.cartas.push(new Carta(TipoCarta.VACA));
    }
    for (let i = 0; i < 2; i++) {
      this.cartas.push(baralho.comprar());
    }
  }

  repor(baralho) {
    while (this.cartas.length < 5 && !baralho.vazio()) {
      this.cartas.push(baralho.comprar());
    }
  }

  tres_pilhas_vazias() {
    let pilhasVazias = 0;
    for (const tipo in this.fichas) {
      if (this.fichas[tipo].length === 0) {
        pilhasVazias++;
      }
    }
    return pilhasVazias >= 3;
  }

  clone() {
    const novo = new Mercado();
    novo.cartas = this.cartas.map((c) => new Carta(c.tipo));
    for (const tipo in this.fichas) {
      novo.fichas[tipo] = this.fichas[tipo].map((f) => new Ficha(f.valor));
    }
    novo.bonus3 = this.bonus3.map((f) => new Ficha(f.valor));
    novo.bonus4 = this.bonus4.map((f) => new Ficha(f.valor));
    novo.bonus5 = this.bonus5.map((f) => new Ficha(f.valor));
    return novo;
  }
}

class Jogador {
  constructor(nome) {
    this.nome = nome;
    this.mao = [];
    this.vacas = [];
    this.selos_excelencia = 0;
    this.fichas_coletadas = [];
    this.pontos_rodada = 0;
  }

  vaca_count() {
    return this.vacas.length;
  }

  pegar_carta(carta) {
    if (carta.tipo === TipoCarta.VACA) {
      this.vacas.push(carta);
    } else if (this.mao.length < 7) {
      this.mao.push(carta);
    }
  }
  resetarParaNovaRodada() {
    this.mao = [];
    this.vacas = [];
    this.fichas_coletadas = [];
    this.pontos_rodada = 0;
  }
  calcular_pontos_rodada() {
    return this.fichas_coletadas.reduce(
      (acc, ficha) => acc + ficha.get_valor(),
      0
    );
  }
  vender_mercadorias(mercado, tipo, quantidade) {
    const cartasParaVender = this.mao.filter((c) => c.tipo === tipo);
    if (cartasParaVender.length < quantidade) return false;

    const ehLuxo = [
      TipoCarta.QUEIJO,
      TipoCarta.OURO,
      TipoCarta.CAFE,
    ].includes(tipo);
    if (ehLuxo && quantidade < 2) return false;

    for (let i = 0; i < quantidade; i++) {
      if (mercado.fichas[tipo].length > 0) {
        this.fichas_coletadas.push(mercado.fichas[tipo].pop());
      }
    }

    if (quantidade >= 3) {
      let bonus_arr;
      if (quantidade === 3) bonus_arr = mercado.bonus3;
      else if (quantidade === 4) bonus_arr = mercado.bonus4;
      else bonus_arr = mercado.bonus5;

      if (bonus_arr.length > 0) {
        this.fichas_coletadas.push(bonus_arr.pop());
      }
    }

    let vendidos = 0;
    const novaMao = [];
    for (const carta of this.mao) {
      if (carta.tipo === tipo && vendidos < quantidade) {
        vendidos++;
      } else {
        novaMao.push(carta);
      }
    }
    this.mao = novaMao;

    return true;
  }

  clone() {
    const novo = new Jogador(this.nome);
    novo.selos_excelencia = this.selos_excelencia;
    novo.mao = this.mao.map((c) => new Carta(c.tipo));
    novo.vacas = this.vacas.map((c) => new Carta(c.tipo));
    novo.fichas_coletadas = this.fichas_coletadas.map(
      (f) => new Ficha(f.valor)
    );
    return novo;
  }
}

class EstadoJogo {
  constructor(jogador1, jogador2, baralho, mercado, turno) {
    this.jogador1 = jogador1;
    this.jogador2 = jogador2;
    this.baralho = baralho;
    this.mercado = mercado;
    this.turno = turno;
  }

  clone() {
    const j1Clone = this.jogador1.clone();
    const j2Clone = this.jogador2.clone();
    const baralhoClone = this.baralho.clone();
    const mercadoClone = this.mercado.clone();
    return new EstadoJogo(
      j1Clone,
      j2Clone,
      baralhoClone,
      mercadoClone,
      this.turno
    );
  }
}
