# Tropeiro de Minas

Bem-vindo ao Tropeiro de Minas, um jogo de cartas digital onde sua estratégia e habilidade de negociação são testadas. Acumule as mercadorias certas, venda na hora certa e torne-se o tropeiro mais bem-sucedido da região!

Este projeto foi desenvolvido com HTML, CSS e JavaScript puro, incluindo uma inteligência artificial como oponente que utiliza o algoritmo Minimax com poda Alfa-Beta para tomar suas decisões.

## Objetivo

Seja o tropeiro mais rico de Minas! O primeiro jogador a conquistar **2 Selos de Excelência** vence o jogo. Você ganha um selo ao vencer uma rodada.

##  Como Jogar

A cada turno, você deve escolher realizar **UMA** das ações a seguir:

### 1. Pegar Cartas

Você pode adquirir novas cartas do mercado de três maneiras:
* **Pegar um produto:** Pegue **1 única carta** de produto que esteja disponível no mercado.
* **Levar as vacas:** Pegue **TODAS as vacas** do mercado de uma só vez.
* **Fazer uma troca:** Troque **2 ou mais cartas** da sua mão (ou das suas vacas) por um número igual de cartas do mercado.

### 2. Vender Cartas

Venda um conjunto de cartas do mesmo tipo da sua mão para acumular pontos.
* Venda **1 ou mais cartas** do mesmo produto para coletar as fichas de pontos correspondentes.
* **Vendas de 3, 4 ou 5 cartas** do mesmo tipo rendem fichas de bônus especiais!
* **Atenção:** Produtos de luxo (💰 Ouro, 🫘 Café, 🧀 Queijo) exigem uma venda mínima de **2 cartas**.

## Fim da Rodada

A rodada termina quando uma de duas condições é atingida:
1.  O baralho de compras se esgota.
2.  Três pilhas de fichas de produtos no mercado acabam.

Ao final da rodada, o jogador com a maior quantidade de vacas ganha um **bônus de 5 pontos**!
