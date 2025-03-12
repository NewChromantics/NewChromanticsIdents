export const VertexShader =
`#version 300 es
precision highp float;
in vec2 TexCoord;
out vec2 uv;

void main()
{
	gl_Position = vec4( 0, 0, 0, 1 );
	gl_Position.xy = mix( vec2(-1), vec2(1), TexCoord );
	uv = TexCoord;
}
`;
export const FragShader =
`#version 300 es
precision highp float;
in vec2 uv;
out vec4 FragColor;

uniform vec4 Viewport;
uniform sampler2D FontSdf;
uniform float SdfEdgeBlurMin;
uniform float SdfEdgeBlurWidth;

struct Glyph
{
	float x,y,width,height,originX,originY,advance;
};
float FontSize = 32.0;


//	"Y":{"x":452,"y":47,"width":37,"height":36,"originX":7,"originY":30,"advance":23},
Glyph Y_glyph = Glyph( 452.0, 47.0, 37.0, 36.0, 7.0, 30.0, 23.0 );

float GetNSample(vec2 Glyphuv)
{
	Glyph glyph = Y_glyph;

	//	put uv into sample space

	//	origin is baseline tweak
	//	get glyph as sample coords (ST)
	vec2 PixelToTexture = vec2(1.0) / vec2( textureSize( FontSdf, 0 ) );

	vec2 topleft = vec2( glyph.x, glyph.y );
	vec2 bottomright = topleft + vec2( glyph.width, glyph.height );
	topleft *= PixelToTexture;
	bottomright *= PixelToTexture;

	float s = mix( topleft.x, bottomright.x, Glyphuv.x );
	float t = 1.0 - mix( topleft.y, bottomright.y, Glyphuv.y );

	float SdfSample = texture( FontSdf, vec2(s,t) ).x - 0.5;
	float Distance = smoothstep( SdfEdgeBlurMin, SdfEdgeBlurMin+SdfEdgeBlurWidth, SdfSample );

	return Distance;
/*	
	
var x0 = x - c.originX;
	var y0 = y - c.originY;
	var s0 = c.x / font.width;
	var t0 = c.y / font.height;

	var x1 = x - c.originX + c.width;
	var y1 = y - c.originY;
	var s1 = (c.x + c.width) / font.width;
	var t1 = c.y / font.height;

	var x2 = x - c.originX;
	var y2 = y - c.originY + c.height;
	var s2 = c.x / font.width;
	var t2 = (c.y + c.height) / font.height;

	var x3 = x - c.originX + c.width;
	var y3 = y - c.originY + c.height;
	var s3 = (c.x + c.width) / font.width;
	var t3 = (c.y + c.height) / font.height;

	vertices.push(x0, y0, s0, t0);
	vertices.push(x1, y1, s1, t1);
	vertices.push(x3, y3, s3, t3);

	vertices.push(x0, y0, s0, t0);
	vertices.push(x3, y3, s3, t3);
	vertices.push(x2, y2, s2, t2);
*/
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
	vec4 Background = vec4(0,0,0,1);

	//	make a square space for a glyph
	//	todo: correct with viewport to make square
	vec2 BoxSize = vec2(0.6) / Viewport.zw;
	vec2 HalfBoxSize = BoxSize / 2.0;
	vec4 Box = vec4( 0.5-HalfBoxSize.x, 0.5-HalfBoxSize.y, 0.5+HalfBoxSize.x, 0.5+HalfBoxSize.y );
	vec2 BoxUv = range( Box.xy, Box.zw, uv );
	if ( BoxUv.x < 0.0 || BoxUv.y < 0.0 || BoxUv.x > 1.0 || BoxUv.y > 1.0 )
	{
		FragColor = Background;
		return;
	}

 vec4 Foreground = vec4(uv,0,1);
	float GlyphDistance = GetNSample(BoxUv);

	FragColor = mix( Background, Foreground, GlyphDistance );
/*
	vec2 FontUv = vec2( uv.x, 1.0-uv.y );
	float SdfSample = texture( FontSdf, FontUv ).x - 0.5;


	float Distance = smoothstep( SdfEdgeBlurMin, SdfEdgeBlurMin+SdfEdgeBlurWidth, SdfSample );


	FragColor = mix( Background, Foreground, Distance );
*/
}
`;
