export const VertexShader =
`#version 300 es
precision highp float;
in vec2 TexCoord;
out vec2 uv;

void main()
{
	gl_Position = vec4( 0, 0, 0, 1 );
	gl_Position.xy = mix( vec2(0.4), vec2(0.9), TexCoord );
	uv = TexCoord;
}
`;
export const FragShader =
`#version 300 es
precision highp float;
in vec2 uv;
out vec4 FragColor;
uniform sampler2D Image;

void main()
{
	FragColor = texture( Image, uv );
	FragColor.w = 1.0;
}
`;
