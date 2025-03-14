

export const Params = {};
export default Params;

Params.SdfEdgeMin = -0.01;
Params.SdfEdgeWidth = 0.01;
Params.CyclePerSecond = 3.0;
Params.CharacterBoxSize = 0.6;
Params.ApplyXOffset = true;
Params.ApplyYOffset = false;
Params.TextSize = 0.5;
Params.TextX = 0.0;
Params.TextY = 0.0;
Params.TextStepY = 0.0;

export const Meta = {};
Meta.ShadowK = { min:0, max:30 };
Meta.LightRotationRadius = { min:0, max:30 };
Meta.LightRotationAnglesPerSecond = { min:0, max:360 };
Meta.SdfSphereXk = { min:-4000, max:4000 };
Meta.SdfSphereYk = { min:-4000, max:4000 };
Meta.SdfSphereZk = { min:-4000, max:4000 };
Meta.SdfSphereRadiusk = { min:-4000, max:4000 };
Meta.SdfBoundsRadius = { min:-20, max:20 };

Meta.SdfEdgeMin = { min:-0.5, max:0.5, step:0.001 };
Meta.SdfEdgeWidth = { min:-0.5, max:0.5, step:0.001 };
Meta.CyclePerSecond = { min:0.0, max:10.0, step:0.1 };
Meta.CharacterBoxSize = { min:0.0, max:1.0, step:0.01 };
Meta.TextSize = { min:0.0, max:1.0, step:0.01 };
Meta.TextStepY = { min:0.0, max:1.0, step:0.01 };
Meta.TextX = { min:0.0, max:1.0, step:0.01 };
Meta.TextY = { min:0.0, max:1.0, step:0.01 };

