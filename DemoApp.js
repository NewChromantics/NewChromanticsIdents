import {CreateBlitQuadGeometry} from './PopEngine/CommonGeometry.js'
import {CreateIdentityMatrix,MatrixInverse4x4} from './PopEngine/Math.js'
import * as ScreenShader from './ScreenShader.js'
import {GetTimeNowMs,Yield} from './PopEngine/PopWebApiCore.js'
import Params from './Params.js'
import PopImage from './PopEngine/PopWebImageApi.js'
import {LoadSdfFont} from './FontSdf.js'


let FontSdf_FuturaBold;


let PopEngineCanvas = null;

const ClearColour = [0.5,0.4,0.45];


async function GetScreenShader()
{
	return [ScreenShader.VertexShader,ScreenShader.FragShader];
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
		Uniforms.Viewport = Viewport;
		return Uniforms;
	}
	
	const BaseUniforms = GetCameraUniforms(Camera,ScreenRect);
	BaseUniforms.TimeSecs = GetTimeNowMs() / 1000.0;
	
	{
		const Geo = 'BlitQuad';
		const Shader = 'ScreenShader';
		const Uniforms = {};
		Object.assign( Uniforms, Params );
		Object.assign( Uniforms, BaseUniforms );
		
		
		Uniforms.FontSdf = FontSdf_FuturaBold.Image;
		
		const Draw = ['Draw',Geo,Shader,Uniforms];
		Commands.push(Draw);
	}
	
	return Commands;
}


export async function OnLoadPopEngineCanvas(Canvas)
{
	FontSdf_FuturaBold = await LoadSdfFont('FuturaBold');
				
	PopEngineCanvas = Canvas;
	PopEngineCanvas.ongetrendercommands = GetRenderCommands;
	
	PopEngineCanvas.RegisterShader('ScreenShader',GetScreenShader);
	PopEngineCanvas.RegisterGeometry('BlitQuad',CreateBlitQuadGeometry);
}
