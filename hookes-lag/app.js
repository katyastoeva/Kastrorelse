"use strict";

(() => {
  const physics = window.HOOKES_PHYSICS;
  const text = window.HOOKES_CONTENT;
  const massInput = document.getElementById("mass");
  const extensionInput = document.getElementById("extension");
  const playButton = document.getElementById("play");
  const status = document.getElementById("motion-status");
  const anchorY = 54;
  const naturalLength = 100;
  const springX = 210;
  const massHeight = 48;
  const pxPerMeter = 300;
  let model;
  let animationFrame = 0;
  let animationStart = 0;
  let playing = false;
  let pausedTime = 0;

  document.querySelectorAll("[data-copy]").forEach((element) => {
    const key = element.dataset.copy;
    if (Object.prototype.hasOwnProperty.call(text, key)) {
      element.textContent = text[key];
    }
  });
  document.title = `${text.heading} | Fysik 1`;

  const format = (value, decimals = 1) => value.toLocaleString("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  function springPath(bottomY) {
    const topY = anchorY + 10;
    const length = Math.max(1, bottomY - topY);
    const coils = 10;
    const points = [];
    for (let index = 0; index <= coils * 8; index += 1) {
      const progress = index / (coils * 8);
      const offset = index === 0 || index === coils * 8
        ? 0
        : 15 * Math.sin(progress * coils * 2 * Math.PI);
      points.push(`${index === 0 ? "M" : "L"} ${(springX + offset).toFixed(1)} ${(topY + progress * length).toFixed(1)}`);
    }
    return points.join(" ");
  }

  function render(time) {
    const state = time === null
      ? {
          extension: model.equilibriumExtension,
          springForce: model.weight,
          netForce: 0
        }
      : physics.motionAtTime(model, time);
    const extensionPx = state.extension * pxPerMeter;
    const massTop = anchorY + naturalLength + extensionPx;
    const massCenter = massTop + massHeight / 2;
    const equilibriumTop = anchorY + naturalLength + model.equilibriumExtension * pxPerMeter;
    const equilibriumCenter = equilibriumTop + massHeight / 2;
    const springForceLength = Math.min(115, 58 * state.springForce / model.weight);
    const netForceLength = Math.min(65, Math.abs(state.netForce) / model.weight * 65);

    document.getElementById("spring").setAttribute("d", springPath(massTop));
    const block = document.getElementById("mass-block");
    block.setAttribute("y", massTop);
    const massMark = document.getElementById("mass-mark");
    massMark.setAttribute("y", massTop + 30);
    document.getElementById("equilibrium-line").setAttribute("y1", equilibriumCenter);
    document.getElementById("equilibrium-line").setAttribute("y2", equilibriumCenter);
    const equilibriumLabel = document.getElementById("equilibrium-label");
    equilibriumLabel.setAttribute("y", equilibriumCenter - 6);

    const weightArrow = document.getElementById("weight-arrow");
    weightArrow.setAttribute("x1", 273);
    weightArrow.setAttribute("x2", 273);
    weightArrow.setAttribute("y1", massCenter);
    weightArrow.setAttribute("y2", massCenter + 58);
    const weightLabel = document.getElementById("weight-arrow-label");
    weightLabel.setAttribute("x", 281);
    weightLabel.setAttribute("y", massCenter + 53);

    const springArrow = document.getElementById("spring-arrow");
    springArrow.setAttribute("x1", 147);
    springArrow.setAttribute("x2", 147);
    springArrow.setAttribute("y1", massCenter);
    springArrow.setAttribute("y2", massCenter - springForceLength);
    const springLabel = document.getElementById("spring-arrow-label");
    springLabel.setAttribute("x", 91);
    springLabel.setAttribute("y", massCenter - springForceLength - 5);

    const netArrow = document.getElementById("net-arrow");
    if (Math.abs(state.netForce) < 0.05) {
      netArrow.setAttribute("visibility", "hidden");
      document.getElementById("net-arrow-label").setAttribute("visibility", "hidden");
    } else {
      const direction = state.netForce > 0 ? 1 : -1;
      netArrow.setAttribute("visibility", "visible");
      document.getElementById("net-arrow-label").setAttribute("visibility", "visible");
      netArrow.setAttribute("x1", 340);
      netArrow.setAttribute("x2", 340);
      netArrow.setAttribute("y1", massCenter);
      netArrow.setAttribute("y2", massCenter + direction * netForceLength);
      const netArrowLabel = document.getElementById("net-arrow-label");
      netArrowLabel.setAttribute("x", 350);
      netArrowLabel.setAttribute("y", massCenter + direction * netForceLength + (direction > 0 ? 5 : -5));
    }

    document.getElementById("live-spring-force").textContent = `${format(state.springForce)} N`;
    document.getElementById("live-net-force").textContent =
      `${state.netForce > 0 ? "↓ " : state.netForce < 0 ? "↑ " : ""}${format(Math.abs(state.netForce), 2)} N`;
    document.getElementById("live-extension").textContent = `${format(state.extension * 100, 0)} cm`;
    document.getElementById("state-label").textContent =
      time === null ? text.equilibriumState : text.movingState;

    document.getElementById("graph-description").textContent =
      `Massan ${format(model.mass)} kilogram. Förlängningen är ${format(state.extension * 100, 0)} centimeter. Tyngdkraften är ${format(model.weight)} newton nedåt och fjäderkraften ${format(state.springForce)} newton uppåt.`;
  }

  function stopAnimation() {
    playing = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    playButton.textContent = text.playButton;
    playButton.setAttribute("aria-label", text.playButton);
  }

  function updateModel() {
    stopAnimation();
    pausedTime = 0;
    const mass = Number(massInput.value);
    const extension = Number(extensionInput.value) / 100;
    model = physics.calculate(mass, extension);

    document.getElementById("mass-value").textContent = `${format(mass)} kg`;
    document.getElementById("extension-value").textContent = `${format(extension * 100, 0)} cm`;
    document.getElementById("spring-constant").textContent = format(model.springConstant);
    document.getElementById("weight").textContent = format(model.weight);
    document.getElementById("period").textContent = format(model.period, 2);
    render(null);
    status.textContent = text.readyStatus;
  }

  function animate(now) {
    if (!playing) return;
    if (animationStart === 0) animationStart = now;
    const time = pausedTime + (now - animationStart) / 1000;
    render(time);
    animationFrame = requestAnimationFrame(animate);
  }

  playButton.addEventListener("click", () => {
    if (playing) {
      pausedTime += (performance.now() - animationStart) / 1000;
      stopAnimation();
      status.textContent = text.pausedStatus;
      return;
    }
    playing = true;
    animationStart = 0;
    playButton.textContent = text.pauseButton;
    playButton.setAttribute("aria-label", text.pauseButton);
    status.textContent = text.playingStatus;
    animationFrame = requestAnimationFrame(animate);
  });

  document.getElementById("reset").addEventListener("click", () => {
    stopAnimation();
    pausedTime = 0;
    render(null);
    status.textContent = text.readyStatus;
  });

  massInput.addEventListener("input", updateModel);
  extensionInput.addEventListener("input", updateModel);
  updateModel();
})();
