"use strict";

window.PROJECTILE_PHYSICS = Object.freeze({
  gravity: 9.82,

  calculate(speed, angleDegrees) {
    if (!Number.isFinite(speed) || speed < 0) {
      throw new RangeError("Begynnelsehastigheten måste vara ett positivt tal eller noll.");
    }
    if (!Number.isFinite(angleDegrees) || angleDegrees < 0 || angleDegrees > 90) {
      throw new RangeError("Kastvinkeln måste vara mellan 0° och 90°.");
    }

    const angle = angleDegrees * Math.PI / 180;
    const horizontalVelocity = speed * Math.cos(angle);
    const verticalVelocity = speed * Math.sin(angle);
    const flightTime = 2 * verticalVelocity / this.gravity;
    const range = horizontalVelocity * flightTime;
    const maxHeight = verticalVelocity ** 2 / (2 * this.gravity);

    return {
      speed,
      angleDegrees,
      horizontalVelocity,
      verticalVelocity,
      flightTime,
      range,
      maxHeight
    };
  },

  positionAtTime(motion, time) {
    const t = Math.max(0, Math.min(time, motion.flightTime));
    if (t === motion.flightTime) {
      return { x: motion.range, y: 0 };
    }
    return {
      x: motion.horizontalVelocity * t,
      y: Math.max(0, motion.verticalVelocity * t - 0.5 * this.gravity * t ** 2)
    };
  }
});
