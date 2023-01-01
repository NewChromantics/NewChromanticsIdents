

export const Params = {};
export default Params;

Params.Debug_DrawSdf = true;
Params.RenderRaymarch = true;
Params.ShadowK = 2.10;
Params.LightRotationRadius = 1;
Params.LightRotationAnglesPerSecond = 45;
Params.SdfBoundsRadius = 4;
Params.SdfSphereX = 0;
Params.SdfSphereY = 0;
Params.SdfSphereZ = 0;
Params.SdfSphereRadius = 0.5;

export const Meta = {};
Meta.ShadowK = { min:0, max:30 };
Meta.LightRotationRadius = { min:0, max:30 };
Meta.LightRotationAnglesPerSecond = { min:0, max:360 };
Meta.SdfSphereX = { min:-4, max:4 };
Meta.SdfSphereY = { min:-4, max:4 };
Meta.SdfSphereZ = { min:-4, max:4 };
Meta.SdfSphereRadius = { min:-4, max:4 };
Meta.SdfBoundsRadius = { min:-20, max:20 };

