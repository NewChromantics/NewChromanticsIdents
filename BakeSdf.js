
export async function BakeSdf(PopEngineCanvas,TargetImage,Geometry,Params)
{
	//	generate commands
	const SetRenderTarget = ['SetRenderTarget',TargetImage,[999,999,999,1] ];
	
	const Uniforms = {};
	const SdfBoundsRadius = Params.SdfBoundsRadius;
	Uniforms.LocalBoundsMin = [-SdfBoundsRadius,-SdfBoundsRadius,-SdfBoundsRadius];
	Uniforms.LocalBoundsMax = [SdfBoundsRadius,SdfBoundsRadius,SdfBoundsRadius];
	Uniforms.OutputPixelSize = [TargetImage.Width,TargetImage.Height];
	
	const DrawParams = {};
	DrawParams.BlendMode = 'min';
	const Draw = ['Draw','BlitQuad','BakeSdf',Uniforms,DrawParams];
	
	const Commands = [SetRenderTarget,Draw];
	await PopEngineCanvas.RenderCommands( Commands );
}
