export class TutorialSystem {
  constructor() {
    this.steps = [
      {
        target: "#j1-mao",
        title: "Sua Mão de Cartas",
        text: "Estas são suas cartas. Você pode ter até 7 cartas na mão. Lembrando que as Vacas não são contadas para mão. Clique em uma carta para selecioná-la para venda ou troca.",
        position: "top",
      },
      {
        target: "#mercado-cartas",
        title: "O Mercado",
        text: "Aqui ficam as cartas disponíveis. Clique em uma carta para pegá-la (se não for vaca). Você também pode trocar cartas com o mercado.",
        position: "bottom",
      },
      {
        target: "#btn-vender",
        title: "Vendendo Produtos",
        text: "Selecione cartas do mesmo tipo na sua mão e clique aqui para vendê-las. Produtos de luxo (Ouro, Café, Queijo) precisam de no mínimo 2 cartas.",
        position: "top",
      },
      {
        target: "#btn-trocar",
        title: "Trocando Cartas",
        text: "Selecione o mesmo número de cartas da sua mão e do mercado, depois clique aqui para trocá-las. Vacas podem ser usadas como moeda de troca!",
        position: "top",
      },
      {
        target: "#btn-pegar-vacas",
        title: "Pegando Vacas",
        text: "Clique aqui para pegar TODAS as vacas do mercado de uma vez. Vacas valem pontos extras no fim da rodada!",
        position: "top",
      },
      {
        target: "#tabela-valores",
        title: "Valores de Referência",
        text: "Aqui você pode ver o valor base de cada produto. Lembre-se: as primeiras vendas valem mais!",
        position: "top",
      },
      {
        target: "#game-info",
        title: "Informações do Jogo",
        text: "Acompanhe o placar, número de cartas restantes e o turno atual. O jogo é melhor de 3 rodadas!",
        position: "bottom",
      },
    ];

    this.currentStep = 0;
    this.isActive = false;
    this.spotlightPadding = 10;
  }

  start() {
    this.isActive = true;
    this.currentStep = 0;

    document.getElementById("tutorial-overlay").classList.add("active");
    document.getElementById("tutorial-progress").classList.add("active");
    document.getElementById("tutorial-mode-indicator").classList.add("active");

    this.createProgressDots();
    this.showStep(0);
  }

  createProgressDots() {
    const dotsContainer = document.getElementById("tutorial-dots");
    dotsContainer.innerHTML = "";

    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement("div");
      dot.className = "tutorial-dot";
      if (i === 0) dot.classList.add("active");
      dotsContainer.appendChild(dot);
    }
  }

  showStep(index) {
    if (index >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[index];
    const target = document.querySelector(step.target);

    if (!target) {
      this.nextStep();
      return;
    }

    this.updateSpotlight(target);
    this.updateTooltip(step, target);
    this.updateProgressDots(index);
    this.enableTargetInteraction(target);
  }

  updateSpotlight(target) {
    const spotlight = document.getElementById("tutorial-spotlight");
    const rect = target.getBoundingClientRect();

    spotlight.style.left = `${rect.left - this.spotlightPadding}px`;
    spotlight.style.top = `${rect.top - this.spotlightPadding}px`;
    spotlight.style.width = `${rect.width + this.spotlightPadding * 2}px`;
    spotlight.style.height = `${rect.height + this.spotlightPadding * 2}px`;
  }

  updateTooltip(step, target) {
    const tooltip = document.getElementById("tutorial-tooltip");
    const title = document.getElementById("tutorial-title");
    const text = document.getElementById("tutorial-text");

    title.textContent = step.title;
    text.textContent = step.text;
    tooltip.style.display = "block";

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    let top;

    if (step.position === "top") {
      top = rect.top - tooltipRect.height - 20;
    } else {
      top = rect.bottom + 20;
    }

    left = Math.max(
      10,
      Math.min(left, window.innerWidth - tooltipRect.width - 10)
    );
    top = Math.max(
      10,
      Math.min(top, window.innerHeight - tooltipRect.height - 10)
    );

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  updateProgressDots(index) {
    const dots = document.querySelectorAll(".tutorial-dot");
    dots.forEach((dot, i) => {
      dot.classList.remove("active");
      if (i < index) {
        dot.classList.add("completed");
      } else if (i === index) {
        dot.classList.add("active");
      }
    });
  }

  enableTargetInteraction(target) {
    const overlay = document.getElementById("tutorial-overlay");
    overlay.style.pointerEvents = "none";

    setTimeout(() => {
      if (this.isActive) {
        overlay.style.pointerEvents = "auto";
      }
    }, 100);
  }

  nextStep() {
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      this.showStep(this.currentStep);
    } else {
      this.complete();
    }
  }

  skip() {
    if (confirm("Tem certeza que deseja pular o tutorial?")) {
      this.complete();
    }
  }

  complete() {
    this.isActive = false;
    document.getElementById("tutorial-overlay").classList.remove("active");
    document.getElementById("tutorial-tooltip").style.display = "none";
    document.getElementById("tutorial-progress").classList.remove("active");
  }
}
