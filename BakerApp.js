import * as Gltf from './PopEngine/PopGltf.js/Gltf.js'
import {CreateCubeGeometry} from './PopEngine/CommonGeometry.js'
import {CreateIdentityMatrix} from './PopEngine/Math.js'

let PopEngineCanvas = null;

const ClearColour = [0.5,0.4,0.45];

let Models = [];


const BasicVertexShader =
`#version 300 es
precision highp float;
//	names in GLTF
in vec3 POSITION;
in vec2 TEXCOORD_0;
#define LocalPosition POSITION
#define LocalUv TEXCOORD_0
out vec2 uv;
uniform mat4 LocalToWorldTransform;
uniform mat4 WorldToCameraTransform;
uniform mat4 CameraProjectionTransform;
void main()
{
	gl_Position = CameraProjectionTransform * WorldToCameraTransform * LocalToWorldTransform * vec4(LocalPosition,1);
	uv = LocalUv.xy;
}
`;
const BasicFragShader =
`#version 300 es
precision highp float;
in vec2 uv;
out vec4 FragColor;

bool IsAlternativeUv()
{
	float GridSize = 0.5;
	vec2 GridUv = mod( uv, GridSize ) / GridSize;
	bool Left = GridUv.x < 0.5;
	bool Top = GridUv.y < 0.5;
	return !(Left==Top);	//	top left and bottom right
}

void main()
{
	bool AlternativeColour = IsAlternativeUv();
	float Blue = AlternativeColour?1.0:0.0;
	FragColor = vec4(uv,Blue,1);
}
`;

async function GetBasicShader()
{
	return [BasicVertexShader,BasicFragShader];
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
		return Uniforms;
	}
	
	for ( let Model of Models )
	{
		const Geo = Model;
		const Shader = 'Basic';
		const Uniforms = GetCameraUniforms(Camera,ScreenRect);
		Uniforms.CameraProjectionTransform = Uniforms.CameraToViewTransform;
		Uniforms.LocalToWorldTransform = CreateIdentityMatrix();
		const Draw = ['Draw',Geo,Shader,Uniforms];
		Commands.push(Draw);
	}
	
	return Commands;
}


export async function OnLoadPopEngineCanvas(Canvas)
{
	PopEngineCanvas = Canvas;
	PopEngineCanvas.ongetrendercommands = GetRenderCommands;
	
	PopEngineCanvas.RegisterShader('Basic',GetBasicShader);
	PopEngineCanvas.RegisterGeometry('Cube',LoadCubeGeometry);
	Models.push('Cube');
	
}
