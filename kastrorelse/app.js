"use strict";

(() => {
  const physics = window.PROJECTILE_PHYSICS;
  const text = window.LESSON_CONTENT;
  const speedInput = document.getElementById("speed");
  const angleInput = document.getElementById("angle");
  const playButton = document.getElementById("play");
  const resetButton = document.getElementById("reset");
  const status = document.getElementById("motion-status");
  const plot = { left: 62, right: 690, top: 28, bottom: 310 };
  const animation = {
    frame: 0,
    playing: false,
    progress: 0,
    startProgress: 0,
    startTime: 0,
    duration: 0
  };
  let motion;
  let scale = 1;

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

  function makePath(points) {
    return points.map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    ).join(" ");
  }

  function graphPoint(position) {
    return {
      x: plot.left + position.x * scale,
      y: plot.bottom - position.y * scale
    };
  }

  function updateTicks() {
    const xGroup = document.getElementById("x-ticks");
    const yGroup = document.getElementById("y-ticks");
    const xExtent = (plot.right - plot.left) / scale;
    const yExtent = (plot.bottom - plot.top) / scale;
    const xStep = xExtent / 4;
    const yStep = yExtent / 4;
    const decimalsForStep = (step) => step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
    let xMarkup = "";
    let yMarkup = "";

    for (let i = 1; i <= 4; i += 1) {
      const x = plot.left + (plot.right - plot.left) * i / 4;
      const xValue = xStep * i;
      xMarkup += `<line x1="${x}" y1="${plot.bottom - 4}" x2="${x}" y2="${plot.bottom + 4}"></line>`;
      xMarkup += `<text x="${x}" y="${plot.bottom + 20}" text-anchor="middle">${format(xValue, decimalsForStep(xStep))}</text>`;

      const y = plot.bottom - (plot.bottom - plot.top) * i / 4;
      const yValue = yStep * i;
      yMarkup += `<line x1="${plot.left - 4}" y1="${y}" x2="${plot.left + 4}" y2="${y}"></line>`;
      yMarkup += `<text x="${plot.left - 9}" y="${y + 4}" text-anchor="end">${format(yValue, decimalsForStep(yStep))}</text>`;
    }
    xGroup.innerHTML = xMarkup;
    yGroup.innerHTML = yMarkup;
  }

  function drawTrajectory() {
    const xSpan = Math.max(motion.range * 1.08, 1.5);
    const ySpan = Math.max(motion.maxHeight * 1.2, 1.5);
    scale = Math.min(
      (plot.right - plot.left) / xSpan,
      (plot.bottom - plot.top) / ySpan
    );

    const points = [];
    const samples = 80;
    for (let i = 0; i <= samples; i += 1) {
      const time = motion.flightTime * i / samples;
      points.push(graphPoint(physics.positionAtTime(motion, time)));
    }
    document.getElementById("trajectory").setAttribute("d", makePath(points));

    const start = graphPoint({ x: 0, y: 0 });
    const landing = graphPoint({ x: motion.range, y: 0 });
    const peak = graphPoint({ x: motion.range / 2, y: motion.maxHeight });
    const heightGuide = document.getElementById("height-guide");
    heightGuide.setAttribute("x1", peak.x);
    heightGuide.setAttribute("x2", peak.x);
    heightGuide.setAttribute("y1", plot.bottom);
    heightGuide.setAttribute("y2", peak.y);
    heightGuide.setAttribute("visibility", motion.maxHeight > 0 ? "visible" : "hidden");

    const heightLabel = document.getElementById("height-label");
    heightLabel.setAttribute("x", peak.x + 7);
    heightLabel.setAttribute("y", peak.y - 7);
    heightLabel.textContent = motion.maxHeight > 0 ? `hₘₐₓ = ${format(motion.maxHeight)} m` : "";

    document.getElementById("range-guide").setAttribute(
      "d",
      `M ${start.x} ${plot.bottom + 31} V ${plot.bottom + 38} M ${start.x} ${plot.bottom + 34} H ${landing.x} M ${landing.x} ${plot.bottom + 31} V ${plot.bottom + 38}`
    );
    const rangeLabel = document.getElementById("range-label");
    rangeLabel.setAttribute("x", (start.x + landing.x) / 2);
    rangeLabel.setAttribute("y", plot.bottom + 58);
    rangeLabel.setAttribute("text-anchor", "middle");
    rangeLabel.textContent = `R = ${format(motion.range)} m`;

    const landingPoint = document.getElementById("landing-point");
    landingPoint.setAttribute("cx", landing.x);
    landingPoint.setAttribute("cy", landing.y);
    const endLabel = document.getElementById("end-label");
    endLabel.setAttribute("x", Math.min(landing.x + 8, plot.right - 58));
    endLabel.setAttribute("y", motion.range * scale < 35 ? plot.bottom + 17 : plot.bottom - 8);

    updateTicks();
    renderBall(animation.progress);
  }

  function renderBall(progress) {
    const position = physics.positionAtTime(motion, motion.flightTime * progress);
    const point = graphPoint(position);
    const ball = document.getElementById("ball");
    ball.setAttribute("cx", point.x);
    ball.setAttribute("cy", point.y);
    const description = motion.flightTime === 0
      ? text.noFlightStatus
      : `Begynnelsehastighet ${format(motion.speed, 0)} meter per sekund, kastvinkel ${format(motion.angleDegrees, 0)} grader, flygtid ${format(motion.flightTime)} sekunder och räckvidd ${format(motion.range)} meter.`;
    document.getElementById("graph-description").textContent = description;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function stopAnimation() {
    animation.playing = false;
    if (animation.frame) {
      cancelAnimationFrame(animation.frame);
      animation.frame = 0;
    }
    playButton.textContent = text.playButton;
    playButton.setAttribute("aria-label", text.playButton);
  }

  function updateModel() {
    stopAnimation();
    animation.progress = 0;
    motion = physics.calculate(Number(speedInput.value), Number(angleInput.value));
    document.getElementById("speed-value").textContent = `${format(motion.speed, 0)} m/s`;
    document.getElementById("angle-value").textContent = `${format(motion.angleDegrees, 0)}°`;
    document.getElementById("flight-time").textContent = format(motion.flightTime);
    document.getElementById("range").textContent = format(motion.range);
    document.getElementById("max-height").textContent = format(motion.maxHeight);
    playButton.disabled = motion.flightTime === 0;
    drawTrajectory();
    setStatus(motion.flightTime === 0 ? text.noFlightStatus : text.readyStatus);
  }

  function animate(now) {
    if (!animation.playing) return;
    if (animation.startTime === 0) animation.startTime = now;
    const elapsed = now - animation.startTime;
    animation.progress = Math.min(
      1,
      animation.startProgress + elapsed / animation.duration
    );
    renderBall(animation.progress);

    if (animation.progress >= 1) {
      stopAnimation();
      setStatus(text.landedStatus);
      return;
    }
    animation.frame = requestAnimationFrame(animate);
  }

  playButton.addEventListener("click", () => {
    if (motion.flightTime === 0) return;
    if (animation.playing) {
      stopAnimation();
      setStatus(text.pausedStatus);
      return;
    }
    if (animation.progress >= 1) animation.progress = 0;
    animation.playing = true;
    animation.startProgress = animation.progress;
    animation.startTime = 0;
    animation.duration = Math.max(motion.flightTime * 800, 600) * (1 - animation.startProgress);
    playButton.textContent = text.pauseButton;
    playButton.setAttribute("aria-label", text.pauseButton);
    setStatus(text.playingStatus);
    animation.frame = requestAnimationFrame(animate);
  });

  resetButton.addEventListener("click", () => {
    stopAnimation();
    animation.progress = 0;
    renderBall(0);
    setStatus(motion.flightTime === 0 ? text.noFlightStatus : text.readyStatus);
  });

  speedInput.addEventListener("input", updateModel);
  angleInput.addEventListener("input", updateModel);
  updateModel();
})();
