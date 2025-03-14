

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
Params.FloorY = 1;
Params.WallZ = 1;
Params.HeadRadius = 1.0;
Params.BounceSurfaceDistance = 0.02;
Params.LightX = 2;
Params.LightY = 8;
Params.LightZ = 6;
Params.LightRadius = 0.1;
Params.ShadowHardness = 6.1;
Params.VignettePow = 0.15;
Params.RenderFloor = true;
Params.RenderWall = false;

Params.TextX = 1;
Params.TextY = 0;
Params.TextZ = 0;
Params.TextExtrusion = 0.1;
Params.TextInflation = 0.0;
Params.FontSdfFalloff = 5;

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


Meta.HeadRadius = { min:0.0, max:10.0, step:0.01 };
Meta.FloorY = { min:-10, max:10, step:0.01 };
Meta.WallZ = { min:-10, max:10, step:0.01 };

Meta.BounceSurfaceDistance = {min:0,max:1,step:0.01};
Meta.LightX = {min:-10,max:10,step:0.01};
Meta.LightY = {min:-10,max:10,step:0.01};
Meta.LightZ = {min:-10,max:10,step:0.01};
Meta.LightRadius = {min:0.1,max:3,step:0.1};
Meta.ShadowHardness = {min:1.0,max:30,step:0.1};


Meta.TextX = {min:-10,max:10,step:0.01};
Meta.TextY = {min:-10,max:10,step:0.01};
Meta.TextZ = {min:-10,max:10,step:0.01};

Meta.TextExtrusion = {min:0.0,max:1,step:0.01};
Meta.TextInflation = {min:0.0,max:0.2,step:0.01};

Meta.FontSdfFalloff = {min:0.0,max:32.0,step:0.5};
