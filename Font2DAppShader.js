export const VertexShader =
`#version 300 es
precision highp float;
in vec2 TexCoord;
out vec2 uv;

void main()
{
	gl_Position = vec4( 0, 0, 0, 1 );
	gl_Position.xy = mix( vec2(-1), vec2(1), TexCoord );
	uv = vec2( TexCoord.x, 1.0 - TexCoord.y );
}
`;
export const FragShader =
`#version 300 es
precision highp float;
in vec2 uv;
out vec4 FragColor;

uniform vec4 Viewport;
uniform sampler2D FontSdf;
uniform float SdfEdgeMin;
uniform float SdfEdgeWidth;

#define MAX_GLYPHS	300
#define MAX_STRING_LENGTH	100
uniform vec4 FontGlyphBounds[MAX_GLYPHS];
uniform vec4 FontGlyphPresentations[MAX_GLYPHS];
uniform int StringGlyphs[MAX_STRING_LENGTH];
uniform float TimeSecs;
uniform int StringLength;
uniform float CyclePerSecond;
uniform float CharacterBoxSize;
uniform bool ApplyXOffset;
uniform bool ApplyYOffset;

uniform float TextSize;
uniform float TextStepY;
uniform float TextX;
uniform float TextY;

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
	
	return Distance;
}

float range(float Min,float Max,float Value)
{
	return (Value-Min) / (Max-Min);
}

vec2 range(vec2 Min,vec2 Max,vec2 Value)
{
	return vec2(
  range( Min.x, Max.x, Value.x ),
  range( Min.y, Max.y, Value.y )
);
}


void main()
{
	vec4 NullBackground = vec4(0,0,0,1);
	vec4 Background = vec4(0,0,0,1);
	vec4 Foreground = vec4(uv,0,1);

 


 vec2 PixelToTexture = vec2(1.0) / vec2( textureSize( FontSdf, 0 ) );
	float TextDistance = 1.0;
	vec2 TextPos = vec2(TextX,TextY);
	for ( int t=0;	t<StringLength;	t++ )
	{
		int GlyphIndex = StringGlyphs[t];
		vec4 GlyphBox = vec4( TextPos, TextPos+vec2(TextSize) );
		vec4 GlyphPres = FontGlyphPresentations[GlyphIndex] / FontSize;
if ( ApplyXOffset )
{
	GlyphBox.x -= GlyphPres.x * TextSize;
	GlyphBox.z -= GlyphPres.x * TextSize;
}
if ( ApplyYOffset )
{
float yoff = (1.0 - GlyphPres.y) * TextSize;
 GlyphBox.y -= yoff;
 GlyphBox.w -= yoff;
}

		vec2 Glyphuv = range( GlyphBox.xy, GlyphBox.zw, uv );
		if ( Inside01(Glyphuv) )
		{
			float GlyphDistance = GetGlyphSample( Glyphuv,GlyphIndex );
			TextDistance = min( TextDistance, GlyphDistance ); 

		//	draw edges
  float DistTox0 = abs(Glyphuv.x) - 0.02;
  float DistToy0 = abs(Glyphuv.y) - 0.02;
  float DistTox1 = abs(Glyphuv.x-1.0) - 0.02;
  float DistToy1 = abs(Glyphuv.y-1.0) - 0.02;
  float EdgeDistance = min( min( DistTox0, DistToy0 ), min( DistTox1, DistToy1 ) );
TextDistance = min( TextDistance, EdgeDistance );
  }

 float Advance = GlyphPres.z;
  TextPos.x += Advance * TextSize;


TextPos.y += TextStepY * TextSize;
  //TextPos.x += TextSize * 0.1;
	}

 TextDistance = smoothstep( SdfEdgeMin, SdfEdgeMin+SdfEdgeWidth, TextDistance );

	FragColor = mix( Foreground, Background, TextDistance );
	return;







	//	make a square space for a glyph
	//	todo: correct with viewport to make square
	vec2 BoxSize = vec2(CharacterBoxSize) / Viewport.zw;
	vec2 HalfBoxSize = BoxSize / 2.0;
	vec4 Box = vec4( 0.5-HalfBoxSize.x, 0.5-HalfBoxSize.y, 0.5+HalfBoxSize.x, 0.5+HalfBoxSize.y );
	vec2 BoxUv = range( Box.xy, Box.zw, uv );
	if ( BoxUv.x < 0.0 || BoxUv.y < 0.0 || BoxUv.x > 1.0 || BoxUv.y > 1.0 )
	{
		FragColor = NullBackground;
		return;
	}

 //Glyph glyph = Y_glyph;
 int StringIndex = int(TimeSecs*CyclePerSecond) % StringLength;
 int GlyphIndex = StringGlyphs[StringIndex];

	float GlyphDistance = GetGlyphSample(BoxUv,GlyphIndex);

	FragColor = mix( Background, Foreground, GlyphDistance );
/*
	vec2 FontUv = vec2( uv.x, 1.0-uv.y );
	float SdfSample = texture( FontSdf, FontUv ).x - 0.5;


	float Distance = smoothstep( SdfEdgeBlurMin, SdfEdgeBlurMin+SdfEdgeBlurWidth, SdfSample );


	FragColor = mix( Background, Foreground, Distance );
*/
}
`;
