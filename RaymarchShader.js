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
uniform vec4 Viewport;

//uniform mat4 ScreenToCameraTransform;
#define ScreenToCameraTransform	ViewToCameraTransform

uniform float TerrainHeightScalar;
uniform sampler2D HeightmapTexture;
uniform sampler2D ColourTexture;
uniform bool SquareStep;
uniform bool DrawColour;
uniform bool DrawHeight;
uniform bool DrawStepHeat;
uniform bool DrawUv;
uniform bool ApplyAmbientOcclusionColour;
uniform bool ApplyHeightColour;
uniform float AmbientOcclusionMin;
uniform float AmbientOcclusionMax;
uniform float BrightnessMult;
uniform float HeightMapStepBack;
uniform vec3 BaseColour;
uniform vec3 BackgroundColour;
uniform float TextureSampleColourMult;
uniform float TextureSampleColourAdd;
const bool FlipSample = true;
uniform float StepHeatMax;
uniform float Shadowk;	//	=1.70
uniform float BounceSurfaceDistance;

uniform float LightX;
uniform float LightY;
uniform float LightZ;
uniform float LightRadius;
uniform float ShadowHardness;
#define WorldLightPosition	vec3(LightX,LightY,LightZ)
#define LightSphere	vec4(LightX,LightY,LightZ,LightRadius)

#define MAX_STEPS	50
#define FAR_Z		300.0
#define FAR_Z_EPSILON	(FAR_Z-0.01)
//	bodge as AO colour was tweaked with 40 steps
#define STEPHEAT_MAX	( StepHeatMax / (float(MAX_STEPS)/40.0) )

uniform float FloorY;
uniform float WallZ;
uniform float HeadX;
uniform float HeadY;
uniform float HeadZ;
uniform float HeadRadius;
#define HeadSphere	vec4(HeadX,HeadY,HeadZ,HeadRadius)
#define WorldUp	vec3(0,1,0)
#define WorldForward	vec3(0,0,1)	


#define GIZMO_NONE 0
#define GIZMO_LIGHT	1

uniform float VignettePow;
uniform bool RenderFloor;
uniform bool RenderWall;

float Distance(vec3 a,vec3 b)
{
 return length( a - b );
}


vec3 ApplyGizmoColour(int Gizmo,vec3 CurrentColour)
{
 if ( Gizmo == 0 )
  return CurrentColour;
 
 return vec3(1,1,1);
}

struct TRay
{
 vec3 Pos;
 vec3 Dir;
};

vec3 ScreenToWorld(vec2 uv,float z)
{
 float x = mix( -1.0, 1.0, uv.x );
 float y = mix( 1.0, -1.0, uv.y );
 vec4 ScreenPos4 = vec4( x, y, z, 1.0 );
 vec4 CameraPos4 = ScreenToCameraTransform * ScreenPos4;
 vec4 WorldPos4 = CameraToWorldTransform * CameraPos4;
 vec3 WorldPos = WorldPos4.xyz / WorldPos4.w;
 
 return WorldPos;
}

//	gr: returning a TRay, or using TRay as an out causes a very low-precision result...
void GetWorldRay(out vec3 RayPos,out vec3 RayDir)
{
 float Near = 0.01;
 float Far = FAR_Z;
 RayPos = ScreenToWorld( uv, Near );
 RayDir = ScreenToWorld( uv, Far ) - RayPos;
 
 //	gr: this is backwards!
 RayDir = -normalize( RayDir );
 //RayDir = normalize( RayDir );
 
 //	mega bodge for webxr views
 //	but, there's something wrong with when we pan (may be using old broken camera code)
 
 if ( RayDir.z < 0.0 )
 {
  //RayDir *= -1.0;
 }
 
}

float Range(float Min,float Max,float Value)
{
 return (Value-Min) / (Max-Min);
}
float Range01(float Min,float Max,float Value)
{
 return clamp(Range(Min,Max,Value),0.0,1.0);
}

vec3 NormalToRedGreen(float Normal)
{
 if ( Normal < 0.5 )
 {
  Normal /= 0.5;
  return vec3( 1.0, Normal, 0.0 );
 }
 else
 {
  Normal -= 0.5;
  Normal /= 0.5;
  return vec3( 1.0-Normal, 1.0, 0.0 );
 }
}


vec3 GetRayPositionAtTime(TRay Ray,float Time)
{
 return Ray.Pos + ( Ray.Dir * Time );
}




uniform sampler2D FontSdf;
uniform float SdfEdgeMin;
uniform float SdfEdgeWidth;
uniform float FontSdfFalloff;

#define MAX_GLYPHS	300
#define MAX_STRING_LENGTH	100
uniform vec4 FontGlyphBounds[MAX_GLYPHS];
uniform vec4 FontGlyphPresentations[MAX_GLYPHS];
uniform int StringGlyphs[MAX_STRING_LENGTH];
uniform int StringLength;

uniform float TextExtrusion;
uniform float TextInflation;

uniform float TimeSecs;
uniform float CyclePerSecond;

bool Inside01(vec2 uv)
{
 return (uv.x >= 0.0 && uv.y >= 0.0 && uv.x <= 1.0 && uv.y <= 1.0 );
} 

struct Glyph
{
 float x,y,width,height,originX,originY,advance;
};
float FontSize = 80.0;

Glyph GetGlyph(int GlyphIndex)
{
 vec4 Bounds = FontGlyphBounds[GlyphIndex];
 return Glyph( Bounds.x, Bounds.y, Bounds.z, Bounds.w, 0.0, 0.0, 0.0 );
}

float GetGlyphSample(vec2 Charuv,int GlyphIndex)
{
 Glyph glyph = GetGlyph( GlyphIndex );

 //	put uv into sample space

 //	origin is baseline tweak
 //	get glyph as sample coords (ST)
 vec2 PixelToTexture = vec2(1.0) / vec2( textureSize( FontSdf, 0 ) );

 vec2 topleft = vec2( glyph.x, glyph.y );
 vec2 bottomright = topleft + vec2( glyph.width, glyph.height );
 topleft *= PixelToTexture;
 bottomright *= PixelToTexture;

 //	input is square, glyph is not
 vec2 Glyphuv = Charuv;

Glyphuv.y = 1.0 - Glyphuv.y;
 Glyphuv.x *= FontSize / glyph.width;
 Glyphuv.y *= FontSize / glyph.height;
Glyphuv.y = 1.0 - Glyphuv.y;

 //	don't sample outside glyphbox
 Glyphuv = clamp( Glyphuv, 0.0, 1.0 );
 //if ( !Inside01(Glyphuv) )
 //	return 99.0;

 //	needed when screen was upside down
 //Glyphuv.y = 1.0 - Glyphuv.y;
 
 float s = mix( topleft.x, bottomright.x, Glyphuv.x );
 float t = mix( topleft.y, bottomright.y, Glyphuv.y );

 //	-0.5 so 1.0 inside; 0.0 edge -1 far
 float SdfSample = texture( FontSdf, vec2(s,t) ).x - 0.5;
 //	signed disance, is the opposite of that
 float Distance = -SdfSample;

	//	make output -1...1
 Distance *= 2.0;

 //	at this point "distance" is arbritrary. 
 //	But we should be able to convert it to UV/texels...
 //	if the original render falloff is F pixels
 //	then 1==Falloff pixels from edge.
float FalloffTexelSize = FontSdfFalloff / (FontSize*0.5);
Distance *= FalloffTexelSize;

 //	view-source:https://evanw.github.io/font-texture-generator/

 return Distance;
}

float extrudeDist (float d, float w, float y)
{
	return length(vec2(max(d, 0.), y - clamp(y, -w, w)))
		+ min(max(d, abs(y)-w), 0.);
}

#define PI 3.14159265359

uniform float TextX,TextY,TextZ;

float DistanceToLetter(vec3 Position)
{
	vec3 LetterPos = vec3(TextX,TextY,TextZ);

	//	move to letter space
	Position -= LetterPos;

	//	
	float Distance = length( Position );

	//	sample glpyh
	int GlyphIndex = StringGlyphs[ int(TimeSecs*CyclePerSecond) % StringLength ];

	//	this assumes 0,0 local space is 0,0 of uv.
	//	and 1,1, samples bottom left space of glyph
	//	therefore a glyph is 1x1 in size
	//	when it returns max distance that must be a max of $PixelFalloff - but what's that in texels...
	vec2 GlyphLocalCenter = vec2(0.5,0.5);
	float GlyphDistance = GetGlyphSample( Position.xz-GlyphLocalCenter, GlyphIndex );

	//	this distance is an arbritrary 1 max
	GlyphDistance = max( 0.0, GlyphDistance );

	Distance = extrudeDist( GlyphDistance, TextExtrusion, Position.y);

	//	round off by inflating
	Distance -= TextInflation;

	return Distance;
}



float sdSphere(vec3 Position,vec4 Sphere)
{
 return length( Position-Sphere.xyz )-Sphere.w;
}

float sdPlane( vec3 p, vec3 n, float h )
{
 // n must be normalized
 n = normalize(n);
 return dot(p,n) + h;
}


//vec2 sdFloor(vec3 Position,vec3 Direction)
float sdFloor(vec3 Position,vec3 Direction)
{
 //return vec2(999.0,0.0);//	should fail to render a floor
 float d = sdPlane(Position,WorldUp,FloorY);
 float tp1 = ( Position.y <= FloorY ) ? 1.0 : 0.0;
 /*
  float tp1 = (Position.y-FloorY)/Direction.y;
  if ( tp1 > 0.0 )
  {
  //d = tp1;	//	gr: why is sdPlane distance wrong? but right in map() 
  tp1 = 1.0;
  }
  else
  {
  //d = 99.9;
  tp1 = 0.0;
  }
  */
 //return vec2(d,tp1);
 return d;
}

float sdWall(vec3 Position,vec3 Direction)
{
 //return vec2(999.0,0.0);//	should fail to render a floor
 float d = sdPlane(Position,WorldForward,WallZ);
 //float tp1 = ( Position.z <= WallZ ) ? 1.0 : 0.0;
 /*
  float tp1 = (Position.y-FloorY)/Direction.y;
  if ( tp1 > 0.0 )
  {
  //d = tp1;	//	gr: why is sdPlane distance wrong? but right in map() 
  tp1 = 1.0;
  }
  else
  {
  //d = 99.9;
  tp1 = 0.0;
  }
  */
 //return vec2(d,tp1);
 return d;
}


/*
// modified Keinert et al's inverse Spherical Fibonacci Mapping
//	p is normal to center
//	n is subdivisions
vec4 inverseSF( in vec3 p, const in float n )
{
 //const float PI = 3.14159265359;
 float PHI = 1.61803398875;
 float phi = min(atan(p.y,p.x),PI);
 float k   = max(floor(log(n*PI*sqrt(5.0)*(1.-p.z*p.z))/log(PHI+1.)),2.0);
 float Fk = pow(PHI,k)/sqrt(5.0);
 
 vec2  F   = vec2( round(Fk), round(Fk*PHI) );
  
 
 vec2  G   = PI*(fract((F+1.0)*PHI)-(PHI-1.0));    
 
 mat2 iB = mat2(F.y,-F.x,G.y,-G.x)/(F.y*G.x-F.x*G.y);
 vec2 c = floor(iB*0.5*vec2(phi,n*p.z-n+1.0));
 
 float ma = 0.0;
 vec4 res = vec4(0);
 for( int s=0; s<4; s++ )
 {
  vec2 uv = vec2(s&1,s>>1);
  float i = dot(F,uv+c);
  float phi = 2.0*PI*fract(i*PHI);
  float cT = 1.0 - (2.0*i+1.0)/n;
  float sT = sqrt(1.0-cT*cT);
  vec3 q = vec3(cos(phi)*sT, sin(phi)*sT,cT);
  float a = dot(p,q);
  if (a > ma)
  {
   ma = a;
   res.xyz = q;
   res.w = i;
  }
 }
 return res;
}
*/
float DistanceToHead(vec3 Position)
{
 return sdSphere( Position, HeadSphere );
}



float DistanceToScene(vec3 Position,vec3 RayDirection)
{
 float Dist = FAR_Z;
 
Dist = min( Dist, DistanceToLetter(Position) );
 //Dist = min( Dist, DistanceToHead(Position) );
if ( RenderFloor )
 Dist = min( Dist, sdFloor(Position,RayDirection) );
if ( RenderWall )
 Dist = min( Dist, sdWall(Position,RayDirection) );
 
 return Dist;
}

//	return gizmo code of an object in front of the current traced ray
int GetGizmo(TRay Ray,vec4 CurrentHitPosition)
{
 float DistanceToHit = distance( Ray.Pos, CurrentHitPosition.xyz ); 
 float DistanceToLight = sdSphere( Ray.Pos, LightSphere );

 if ( DistanceToLight < DistanceToHit )
 {
  //	move the ray, did it actually hit
  vec3 NearLightPos = Ray.Pos + Ray.Dir * DistanceToLight;
  DistanceToLight = sdSphere( NearLightPos, LightSphere );
  if ( DistanceToLight < 0.01 )
   return GIZMO_LIGHT;
 }
 
 return GIZMO_NONE;
}

//	returns hitpos,success
vec4 RayMarchScene(TRay Ray)
{
 const float MinDistance = 0.01;
 const float CloseEnough = MinDistance;
 const float MinStep = 0.0;//MinDistance;
 const float MaxDistance = FAR_Z_EPSILON;
 const int MaxSteps = MAX_STEPS;
 
 //	todo: raytrace wall/floor
 
 
 float RayTraversed = 0.0;	//	world space distance
 
 for ( int s=0;	s<MaxSteps;	s++ )
 {
  vec3 Position = Ray.Pos + Ray.Dir * RayTraversed;
  float SceneDistance = DistanceToScene( Position, Ray.Dir );
  float HitDistance = SceneDistance;
  
  RayTraversed += max( HitDistance, MinStep );
  /*	iq version
  if( abs(HitDistance) < (0.0001*RayTraversed) )
  { 
   return vec4(Position,1);
  }
  */
  if ( HitDistance < CloseEnough )
   return vec4(Position,1);
  
  //	ray gone too far
  if (RayTraversed >= MaxDistance)
   return vec4(Position,0);
 }

 //	ray never got close enough
 return vec4(0,0,0,-1);
}


float RayMarchSceneOcclusion(TRay Ray)
{
 const float MinDistance = 0.01;
 const float CloseEnough = MinDistance;
 const float MinStep = MinDistance;
 //const float MaxDistance = FAR_Z_EPSILON;
 const int MaxSteps = MAX_STEPS;
 
 float MaxDistance = length(Ray.Dir);
 Ray.Dir = normalize(Ray.Dir);
 
 //float Occlusion = 0.0;
 float Light = 1.0;
 float RayTraversed = 0.0;	//	world space distance
 
 //	this must be relative to ShadowHardness
 //	reverse the func
 //float MaxDistanceForShadow = ShadowHardness * 1.1;
 float MaxDistanceForShadow = MaxDistance;
 
 for ( int s=0;	s<MaxSteps;	s++ )
 {
  vec3 Position = Ray.Pos + (Ray.Dir * RayTraversed);
  float SceneDistance = DistanceToScene( Position, Ray.Dir );
  float HitDistance = SceneDistance;

  
  RayTraversed += max( HitDistance, MinStep );

  if ( HitDistance < MaxDistanceForShadow )
  {
   //	accumulate occlusion as we go
   //	the further down the ray, the more we accumualate the near misses
   float Bounce = clamp( ShadowHardness * HitDistance / RayTraversed,0.0,1.0);
   Light = min( Light, Bounce );
   //Occlusion = max( Occlusion, Bounce );
  }	

  
  if ( HitDistance < CloseEnough )
  {
   Light = 0.0;
   break;
  }
  
  //	ray gone too far, never hit anything
  if (RayTraversed >= MaxDistance)
  {
   //Occlusion = 0.0;
   break;
  }
  
  if ( Light <= 0.0 )
   break;
 }
 
 Light = clamp( Light, 0.0, 1.0 );
 Light*Light*(3.0-2.0*Light);
 float Occlusion = 1.0 - Light;
 return Occlusion;
}

float MapDistance(vec3 Position)
{
 vec3 Dir = vec3(0,1,0);
 return DistanceToScene( Position, Dir );
}

vec3 calcNormal(vec3 pos)
{
 //return WorldUp;
 vec2 e = vec2(1.0,-1.0)*0.5773;
 const float eps = 0.0005;
 return normalize( e.xyy * MapDistance( pos + e.xyy*eps ) + 
	  e.yyx * MapDistance( pos + e.yyx*eps ) + 
	  e.yxy * MapDistance( pos + e.yxy*eps ) + 
	  e.xxx * MapDistance( pos + e.xxx*eps ) );
}



void main()
{
 TRay Ray;
 GetWorldRay(Ray.Pos,Ray.Dir);
 vec4 Colour = vec4(BackgroundColour,0.0);
 
 vec4 HitPos_Valid = RayMarchScene(Ray);
/*
  if ( HitPos_Valid.w > 0.0 )
 {
	FragColor = vec4(0,1,0,1);
}
else
{
	FragColor = vec4(1,0,0,1);
}
return;
 */

 if ( HitPos_Valid.w > 0.0 )
 {
  vec3 HitPos = HitPos_Valid.xyz;
  vec3 Normal = calcNormal(HitPos);
  float StepAwayFromSurface = BounceSurfaceDistance;
  
  Colour = vec4( HitPos, 1.0 );
  //Colour = vec4( abs(HitPos), 1.0 );
  Colour = vec4( abs(Normal),1.0);
Colour = vec4(1,1,1,1);
  
  bool ApplyHardOcclusion = true;
  float ShadowMult = 0.0;	//	shadow colour
  
  if ( ApplyHardOcclusion )
  {
   TRay OcclusionRay;
   OcclusionRay.Pos = HitPos+Normal*StepAwayFromSurface;
	//	length of this ray is used as max distance, as we dont wanna go further than the light
   OcclusionRay.Dir = WorldLightPosition - HitPos;
   float Occlusion = RayMarchSceneOcclusion( OcclusionRay );
   Colour.xyz = mix( Colour.xyz, vec3(ShadowMult), Occlusion );
   //Colour.xyz = normalize(OcclusionRay.Dir);
  }

 }
 
 //	render gizmos
 int Gizmo = GetGizmo( Ray, HitPos_Valid );
 Colour.xyz = ApplyGizmoColour(Gizmo,Colour.xyz);
 /*
 
 //	vignette
 float Vignette = pow( 16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), VignettePow );
 Colour.xyz *= Vignette;
 */
 FragColor = vec4(Colour.xyz,1.0);

}
`;
