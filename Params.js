

export const Params = {};
export default Params;

Params.SdfEdgeBlurMin = 0;
Params.SdfEdgeBlurWidth = 0.1;

export const Meta = {};
Meta.ShadowK = { min:0, max:30 };
Meta.LightRotationRadius = { min:0, max:30 };
Meta.LightRotationAnglesPerSecond = { min:0, max:360 };
Meta.SdfSphereXk = { min:-4000, max:4000 };
Meta.SdfSphereYk = { min:-4000, max:4000 };
Meta.SdfSphereZk = { min:-4000, max:4000 };
Meta.SdfSphereRadiusk = { min:-4000, max:4000 };
Meta.SdfBoundsRadius = { min:-20, max:20 };

Meta.SdfEdgeBlurMin = { min:-0.5, max:0.5, step:0.001 };
Meta.SdfEdgeBlurWidth = { min:-0.5, max:0.5, step:0.001 };
