

export const Params = {};
export default Params;

Params.Debug_DrawSdf = true;
Params.RenderRaymarch = true;
Params.ShadowK = 2.10;
Params.LightRotationRadius = 1;
Params.LightRotationAnglesPerSecond = 45;
Params.SdfBoundsRadius = 4;
Params.SdfSphereXk = 0;
Params.SdfSphereYk = 0;
Params.SdfSphereZk = 0;
Params.SdfSphereRadiusk = 0.5 * 1000;

export const Meta = {};
Meta.ShadowK = { min:0, max:30 };
Meta.LightRotationRadius = { min:0, max:30 };
Meta.LightRotationAnglesPerSecond = { min:0, max:360 };
Meta.SdfSphereXk = { min:-4000, max:4000 };
Meta.SdfSphereYk = { min:-4000, max:4000 };
Meta.SdfSphereZk = { min:-4000, max:4000 };
Meta.SdfSphereRadiusk = { min:-4000, max:4000 };
Meta.SdfBoundsRadius = { min:-20, max:20 };

