export const VertexShader =
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
uniform mat4 CameraToViewTransform;
void main()
{
	gl_Position = CameraToViewTransform * WorldToCameraTransform * LocalToWorldTransform * vec4(LocalPosition,1);
	uv = LocalUv.xy;
}
`;
export const FragShader =
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
