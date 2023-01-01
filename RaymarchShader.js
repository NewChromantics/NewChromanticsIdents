export const VertexShader =
`#version 300 es
precision highp float;
in vec2 TexCoord;
out vec2 uv;
out vec4 OutputProjectionPosition;

void main()
{
	gl_Position = vec4( 0, 0, 0, 1 );
	gl_Position.xy = mix( vec2(-1), vec2(1), TexCoord );
	uv = TexCoord;
	OutputProjectionPosition = gl_Position;
}
`;

export const FragShader =
`#version 300 es
precision highp float;
in vec2 uv;
out vec4 FragColor;

uniform mat4 CameraToViewTransform;
uniform mat4 WorldToCameraTransform;
uniform mat4 CameraToWorldTransform;
uniform mat4 ViewToCameraTransform;

in vec4 OutputProjectionPosition;
uniform float ShadowK;// = 2.100;
float FloorSize = 50.0;
#define FarZ	100.0
#define WorldUp	vec3(0,1,0)
uniform float TimeSecs;
#define dm_t	vec2	//	distance material
#define dmh_t	vec3	//	distance material heat
#define PinkColour		vec3(1,0,1)
uniform vec4 RenderTargetRect;
#define MAX_STEPS	100

#define Mat_None		0.0
#define Mat_Green		1.0
#define Mat_Red			2.0
#define GreenColour		vec3(0,1,0)
#define GreenSpecular	0.3
#define RedColour		vec3(1,0,0)
#define RedSpecular	0.3

#define WorldLightPosition	GetWorldLightPosition()
vec3 LightOrigin = vec3( -13, 20, 7 );
uniform float LightRotationRadius;
uniform float LightRotationAnglesPerSecond;

vec3 GetWorldLightPosition()
{
	vec3 LightPos = LightOrigin;
	float AngleDeg = TimeSecs * LightRotationAnglesPerSecond;
	LightPos.x += cos( radians(AngleDeg) ) * LightRotationRadius;
	LightPos.z += sin( radians(AngleDeg) ) * LightRotationRadius;
	return LightPos;
}


void GetWorldRay(out vec3 RayPos,out vec3 RayDir)
{
	//	2d -> view
float Near = 0.001;
float Far = 0.95;
 vec4 ViewPosNear = ViewToCameraTransform * vec4( OutputProjectionPosition.xy, Near, 1.0 );
 vec4 ViewPosFar = ViewToCameraTransform * vec4( OutputProjectionPosition.xy, Far, 1.0 );
vec4 WorldPosNear = CameraToWorldTransform * ViewPosNear;
vec4 WorldPosFar = CameraToWorldTransform * ViewPosFar;
vec3 WorldPosNear3 = WorldPosNear.xyz / WorldPosNear.w;
vec3 WorldPosFar3 = WorldPosFar.xyz / WorldPosFar.w;

	RayPos = WorldPosNear3;
	RayDir = WorldPosFar3 - WorldPosNear3;
	RayDir = normalize(RayDir);
}
float rand(vec3 co)
{
	return fract(sin(dot(co, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}
float opUnion( float d1, float d2 )			{ return min(d1,d2); }
float opSubtraction( float d1, float d2 )	{ return max(-d1,d2); }
float opIntersection( float d1, float d2 )	{ return max(d1,d2); }
float sdPlane( vec3 p, vec3 n, float h )	{return dot(p,n) + h;}
float sdSphere(vec3 Position,vec4 Sphere)
{
	return length( Position-Sphere.xyz )-Sphere.w;
}
float sdBox( vec3 p, vec3 c, vec3 b )
{
	p = p-c;
	vec3 q = abs(p) - b;
	return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}
dm_t Closest(dm_t a,dm_t b)
{
	return a.x < b.x ? a : b;
}
dm_t Map(vec3 Position,vec3 Dir)
{
	dm_t d = dm_t(999.0,Mat_None);
 d = Closest( d, dm_t( sdBox( Position, vec3(0,0,0), vec3(1,1,1) ), Mat_Green) );
 d = Closest( d, dm_t( sdBox( Position, vec3(0,-1,0), vec3(FloorSize,0.01,FloorSize) ), Mat_Red) );
	return d;
}
float MapDistance(vec3 Position)
{
	vec3 Dir = vec3(0,0,0);
	return Map( Position, Dir ).x;
}
vec3 calcNormal(vec3 pos)
{
	vec2 e = vec2(1.0,-1.0)*0.5773;
	const float eps = 0.0005;
	vec3 Dir = vec3(0,0,0);
	return normalize( e.xyy * MapDistance( pos + e.xyy*eps ) +
					  e.yyx * MapDistance( pos + e.yyx*eps ) +
					  e.yxy * MapDistance( pos + e.yxy*eps ) +
					  e.xxx * MapDistance( pos + e.xxx*eps ) );
}
dmh_t GetRayCastDistanceHeatMaterial(vec3 RayPos,vec3 RayDir)
{
	float MaxDistance = FarZ;
	float RayDistance = 0.0;
	float HitMaterial = Mat_None;
	float Heat = 0.0;
	
	for ( int s=0;	s<MAX_STEPS;	s++ )
	{
		Heat += 1.0/float(MAX_STEPS);
		vec3 StepPos = RayPos + (RayDir*RayDistance);
		dm_t StepDistanceMat = Map(StepPos,RayDir);
		RayDistance += StepDistanceMat.x;
		if ( RayDistance >= MaxDistance )
		{
			RayDistance = MaxDistance;
			//HitMaterial = Mat_Red;
			break;
		}
		if ( StepDistanceMat.x < 0.004 )
		{
			HitMaterial = StepDistanceMat.y;
			break;
		}
	}
	return dmh_t( RayDistance, HitMaterial, Heat );
}
float ZeroOrOne(float f)
{
	//	or max(1.0,floor(f+0.0001)) ?
	//return max( 1.0, f*10000.0);
	return (f ==0.0) ? 0.0 : 1.0;
}
vec3 GetNormalColour(vec3 Normal)
{
	Normal += 1.0;
	Normal /= 2.0;
	return Normal;
}
float Range(float Min,float Max,float Value)
{
	return (Value-Min) / (Max-Min);
}
vec4 GetLitColour(vec3 WorldPosition,vec3 Normal,vec3 SeedColour,float Specular)
{
	//return vec4(SeedColour,1.0);
	vec3 RumBright = SeedColour * vec3(1.0/0.7,1.0/0.5,1.0/0.1);
	vec3 RumMidTone = SeedColour;
	vec3 Colour = RumMidTone;
		
	vec3 DirToLight = normalize( WorldLightPosition-WorldPosition );
	float Dot = max(0.0,dot( DirToLight, Normal ));
	Colour = mix( Colour, RumBright, Dot );
	
	//	specular
	float DotMax = mix( 1.0, 0.96, Specular );
	if ( Dot > DotMax )
		Colour = vec3(1,1,1);
		
	return vec4( Colour, 1.0 );
}
vec4 GetMaterialColour(float Material,vec3 WorldPos,vec3 WorldNormal)
{
	if ( Material == Mat_None )		return vec4(0,0,0,0);
	if ( Material == Mat_Green )	return GetLitColour( WorldPos, WorldNormal, GreenColour, GreenSpecular );
	if ( Material == Mat_Red )		return GetLitColour( WorldPos, WorldNormal, RedColour, RedSpecular );

	return GetLitColour(WorldPos,WorldNormal,PinkColour,1.0);
}
float softshadow( in vec3 ro, in vec3 rd, float k )
{
	float res = 1.0;
	float ph = 1e20;
	float t = 0.0;
	for ( int i=0;	i<10;	i++ )
	{
		float h = MapDistance(ro + rd*t);
		if( h<0.001 )
			return 0.0;
		float y = h*h/(2.0*ph);
		float d = sqrt(h*h-y*y);
		res = min( res, k*d/max(0.0,t-y) );
		ph = h;
		t += h;
	}
	return res;
}

float HardShadow(vec3 Position,vec3 Direction)
{
	vec4 HitShadow = GetRayCastDistanceHeatMaterial( Position, Direction ).xzzy;
	return HitShadow.w > 0.0 ? 0.0 : 1.0;
}


void main()
{
	vec3 RayPos,RayDir;
	GetWorldRay( RayPos, RayDir );
	vec4 HitDistance = GetRayCastDistanceHeatMaterial(RayPos,RayDir).xzzy;
	vec3 HitPos = RayPos + (RayDir*HitDistance.x);
	
	vec3 Normal = calcNormal(HitPos);
	vec4 Colour = GetMaterialColour(HitDistance.w,HitPos,Normal);
		
	//Colour.xyz *= mix(1.0,0.7,HitDistance.y);	//	ao from heat
		
	vec3 ShadowRayPos = HitPos+Normal*0.1;
	vec3 ShadowRayDir = normalize(WorldLightPosition-HitPos);

	float Light = 0.0;

	//float Shadow = softshadow( ShadowRayPos, ShadowRayDir, ShadowK );
	float Shadow = HardShadow( ShadowRayPos, ShadowRayDir );
	Light += Shadow * 0.5;

	Colour.xyz = Colour.xyz * Light;
	FragColor = Colour;

	if ( Colour.w == 0.0 )	discard;
}
`;
