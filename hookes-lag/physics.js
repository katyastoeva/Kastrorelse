"use strict";

window.HOOKES_PHYSICS = Object.freeze({
  gravity: 9.82,

  calculate(mass, equilibriumExtension) {
    if (!Number.isFinite(mass) || mass <= 0) {
      throw new RangeError("Massan måste vara större än noll.");
    }
    if (!Number.isFinite(equilibriumExtension) || equilibriumExtension <= 0) {
      throw new RangeError("Förlängningen måste vara större än noll.");
    }

    const weight = mass * this.gravity;
    const springConstant = weight / equilibriumExtension;
    const angularFrequency = Math.sqrt(springConstant / mass);

    return {
      mass,
      equilibriumExtension,
      weight,
      springConstant,
      angularFrequency,
      period: 2 * Math.PI / angularFrequency
    };
  },

  motionAtTime(model, time) {
    const amplitude = model.equilibriumExtension * 0.45;
    const extension = model.equilibriumExtension
      + amplitude * Math.sin(model.angularFrequency * time);
    const springForce = model.springConstant * extension;
    return {
      extension,
      springForce,
      netForce: model.weight - springForce
    };
  }
});
