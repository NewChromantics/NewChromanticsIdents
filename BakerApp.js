import * as Gltf from './PopEngine/PopGltf.js/Gltf.js'
import {CreateCubeGeometry,CreateBlitQuadGeometry} from './PopEngine/CommonGeometry.js'
import {CreateIdentityMatrix,MatrixInverse4x4} from './PopEngine/Math.js'
import * as BasicShader from './BasicShader.js'
import * as RaymarchShader from './RaymarchShader.js'

import Params from './Params.js'

let PopEngineCanvas = null;

const ClearColour = [0.5,0.4,0.45];

let Models = [];


async function GetBasicShader()
{
	return [BasicShader.VertexShader,BasicShader.FragShader];
}
async function GetRaymarchShader()
{
	return [RaymarchShader.VertexShader,RaymarchShader.FragShader];
}

async function LoadGltf(Filename)
{
	
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
	
	if ( Params.RenderRaymarch )
	{
		const Geo = 'BlitQuad';
		const Shader = 'Sdf';
		const Uniforms = {};
		Object.assign( Uniforms, Params );
		Object.assign( Uniforms, GetCameraUniforms(Camera,ScreenRect) );

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
			Object.assign( Uniforms, GetCameraUniforms(Camera,ScreenRect) );
			Uniforms.LocalToWorldTransform = CreateIdentityMatrix();
			const Draw = ['Draw',Geo,Shader,Uniforms];
			Commands.push(Draw);
		}
	}
	
	return Commands;
}


export async function OnLoadPopEngineCanvas(Canvas)
{
	PopEngineCanvas = Canvas;
	PopEngineCanvas.ongetrendercommands = GetRenderCommands;
	
	PopEngineCanvas.RegisterShader('Basic',GetBasicShader);
	PopEngineCanvas.RegisterShader('Sdf',GetRaymarchShader);
	PopEngineCanvas.RegisterGeometry('Cube',LoadCubeGeometry);
	PopEngineCanvas.RegisterGeometry('BlitQuad',CreateBlitQuadGeometry);
	
	Models.push('Cube');
	
}
