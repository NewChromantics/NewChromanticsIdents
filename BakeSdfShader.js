export const VertexShader =
`#version 300 es
precision highp float;
in vec2 TexCoord;

//	instanced triangle xyz,xyz,xyz
in mat3 TrianglePositions;
out mat3 LocalTrianglePositions;

void main()
{
	gl_Position = vec4( 0, 0, 0, 1 );
	gl_Position.xy = mix( vec2(-1), vec2(1), TexCoord );

	LocalTrianglePositions = TrianglePositions;
}
`;

export const FragShader =
`#version 300 es
precision highp float;

//in vec4 gl_FragCoord;

uniform float	SdfSphereX;
uniform float	SdfSphereY;
uniform float	SdfSphereZ;
uniform float	SdfSphereRadius;
#define SpherePositionRadius	vec4(SdfSphereX,SdfSphereY,SdfSphereZ,SdfSphereRadius)

uniform vec3	LocalBoundsMin;
uniform vec3	LocalBoundsMax;
uniform vec2	OutputPixelSize;
#define OutputPixelPosition	(gl_FragCoord.xy)
#define SDF_LAYERS_X	(OutputPixelSize.x)
#define SDF_LAYERS_Y	(OutputPixelSize.y / float(SDF_LAYERS_Z))
#define SDF_LAYERS_Z	20

in mat3 LocalTrianglePositions;

out vec4 FragColor;

vec3 PixelPositionToSdfPosition(vec2 PixelPosition)
{
	vec3 Position;
	Position.x = PixelPosition.x;
	Position.y = mod( PixelPosition.y, float(SDF_LAYERS_Z) );
	Position.z = PixelPosition.y / float(SDF_LAYERS_Z);
	
	//	normalise to sdf space
	Position /= vec3(SDF_LAYERS_X,SDF_LAYERS_Y,SDF_LAYERS_Z);
	return Position;
}

vec3 SdfPositionToLocalPosition(vec3 SdfPosition)
{
	vec3 LocalPosition = mix( LocalBoundsMin, LocalBoundsMax, SdfPosition );
	return LocalPosition;
}

void main()
{
	vec3 SdfPosition = PixelPositionToSdfPosition(OutputPixelPosition);
	vec3 OutputLocalPosition = SdfPositionToLocalPosition( SdfPosition );
	float Distance = length( OutputLocalPosition - SpherePositionRadius.xyz ) - SpherePositionRadius.w;
	FragColor = vec4( Distance, Distance, Distance, 1.0 );
}
`;
