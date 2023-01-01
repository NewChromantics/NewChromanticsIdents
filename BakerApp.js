import * as Gltf from './PopEngine/PopGltf.js/Gltf.js'
import {CreateCubeGeometry,CreateBlitQuadGeometry} from './PopEngine/CommonGeometry.js'
import {CreateIdentityMatrix,MatrixInverse4x4} from './PopEngine/Math.js'
import * as BasicShader from './BasicShader.js'
import * as RaymarchShader from './RaymarchShader.js'
import * as BakeSdfShader from './BakeSdfShader.js'
import * as BlitShader from './BlitShader.js'
import {GetTimeNowMs,Yield} from './PopEngine/PopWebApiCore.js'
import Params from './Params.js'
import PopImage from './PopEngine/PopWebImageApi.js'
import {BakeSdf} from './BakeSdf.js'

let PopEngineCanvas = null;

const ClearColour = [0.5,0.4,0.45];

let Models = [];
let SdfImage = null;


async function GetBasicShader()
{
	return [BasicShader.VertexShader,BasicShader.FragShader];
}

async function GetRaymarchShader()
{
	return [RaymarchShader.VertexShader,RaymarchShader.FragShader];
}

async function GetBakeSdfShader()
{
	return [BakeSdfShader.VertexShader,BakeSdfShader.FragShader];
}

async function GetBlitShader()
{
	return [BlitShader.VertexShader,BlitShader.FragShader];
}

async function LoadCubeGeometry()
{
	//	names in GLTF
	const Geo = await CreateCubeGeometry();
	Geo.POSITION = Geo.POSITION || Geo.LocalPosition;
	Geo.TEXCOORD_0 = Geo.TEXCOORD_0 || Geo.LocalUv;
	delete Geo.LocalPosition;
	delete Geo.LocalUv;
	return Geo;
}


function GetRenderCommands(Camera,ScreenRect)
{
	const Clear = ['SetRenderTarget',null,ClearColour];
	const Commands = [Clear];
	
	function GetCameraUniforms(Camera,ScreenRect)
	{
		const w = ScreenRect[2];
		const h = ScreenRect[3];
		const Viewport = [0,0,w/w,h/w];
		
		const Uniforms = {};
		Uniforms.CameraToViewTransform = Camera.GetProjectionMatrix(Viewport);
		Uniforms.WorldToCameraTransform = Camera.GetWorldToCameraMatrix();
		Uniforms.CameraToWorldTransform = MatrixInverse4x4( Uniforms.WorldToCameraTransform );
		Uniforms.ViewToCameraTransform = MatrixInverse4x4( Uniforms.CameraToViewTransform );
		return Uniforms;
	}
	
	const BaseUniforms = GetCameraUniforms(Camera,ScreenRect);
	BaseUniforms.TimeSecs = GetTimeNowMs() / 1000.0;
	
	if ( Params.RenderRaymarch )
	{
		const Geo = 'BlitQuad';
		const Shader = 'Raymarch';
		const Uniforms = {};
		Object.assign( Uniforms, Params );
		Object.assign( Uniforms, BaseUniforms );

		const Draw = ['Draw',Geo,Shader,Uniforms];
		Commands.push(Draw);
	}
	else
	{
		for ( let Model of Models )
		{
			const Geo = Model;
			const Shader = 'Basic';
			const Uniforms = {};
			Object.assign( Uniforms, Params );
			Object.assign( Uniforms, BaseUniforms );
			Uniforms.LocalToWorldTransform = CreateIdentityMatrix();
			const Draw = ['Draw',Geo,Shader,Uniforms];
			Commands.push(Draw);
		}
	}
	
	if ( Params.Debug_DrawSdf && SdfImage )
	{
		const Geo = 'BlitQuad';
		const Shader = 'BlitTexture';
		const Uniforms = {};
		Object.assign( Uniforms, Params );
		Object.assign( Uniforms, BaseUniforms );
		Uniforms.Image = SdfImage;

		const Draw = ['Draw',Geo,Shader,Uniforms];
		Commands.push(Draw);
	}
	
	
	return Commands;
}

async function UpdateSdfLoop()
{
	while ( PopEngineCanvas )
	{
		await Yield(100);
		try
		{
			await BakeSdf( PopEngineCanvas, SdfImage, null, Params );
		}
		catch(e)
		{
			console.warn(e);
			await Yield(1000);
		}
	}
}


export async function OnLoadPopEngineCanvas(Canvas)
{
	SdfImage = new PopImage([256,256],'Float4');
	
	PopEngineCanvas = Canvas;
	PopEngineCanvas.ongetrendercommands = GetRenderCommands;
	
	PopEngineCanvas.RegisterShader('Basic',GetBasicShader);
	PopEngineCanvas.RegisterShader('Raymarch',GetRaymarchShader);
	PopEngineCanvas.RegisterShader('BakeSdf',GetBakeSdfShader);
	PopEngineCanvas.RegisterGeometry('Cube',LoadCubeGeometry);
	PopEngineCanvas.RegisterGeometry('BlitQuad',CreateBlitQuadGeometry);
	PopEngineCanvas.RegisterShader('BlitTexture',GetBlitShader);

	Models.push('Cube');
	
	UpdateSdfLoop();
}
