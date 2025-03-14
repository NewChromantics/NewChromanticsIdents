import { LoadFileAsJsonAsync, LoadFileAsImageAsync } from './PopEngine/FileSystem.js'
import PopImage from './PopEngine/PopWebImageApi.js'

export async function LoadSdfFont(Name)
{
	const ImageFilename = `./FontSdf_${Name}.png`;
	const MetaFilename = `./FontSdf_${Name}.meta.json`;
	
	const ImagePromise = LoadFileAsImageAsync(ImageFilename);
	const MetaPromise = LoadFileAsJsonAsync(MetaFilename);
	
	await Promise.all( [ImagePromise,MetaPromise] );
	
	const Meta = await MetaPromise;
	const Image = await ImagePromise;
	
	return new FontSdf(Image,Meta);
}


export class FontSdf
{
	constructor(Image,Meta)
	{
		this.Image = Image;
		this.Image.LinearFilter = true;
		this.Meta = Meta;
	}

	get Characters()
	{
		return Object.keys(this.Meta.characters);
	}
	
	get GlyphBoundsUniform()
	{
		return new Float32Array( this.GetGlyphBounds().flat() );
	}
	
	get GlyphPresentationsUniform()
	{
		return new Float32Array( this.GetGlyphPresentations().flat() );
	}
	
	
	GetGlyphBounds()
	{
		const Chars = this.Characters;
		function GetBoundsVec4(Char)
		{
			const Meta = this.Meta.characters[Char];
			return [Meta.x, Meta.y, Meta.width, Meta.height];
		}
		return Chars.map( GetBoundsVec4.bind(this) );
	}
	
	GetGlyphPresentations()
	{
		const Chars = this.Characters;
		function GetBoundsVec4(Char)
		{
			const Meta = this.Meta.characters[Char];
			return [Meta.originX, Meta.originY, Meta.advance, 0];
		}
		return Chars.map( GetBoundsVec4.bind(this) );
	}
	
	GetGlyphIndex(Char,MissingCharReplacement='A')
	{
		const Chars = this.Characters;
		let Index = Chars.indexOf(Char);
		if ( Index < 0 )
			Index = Chars.indexOf(MissingCharReplacement);

		return Index;
	}
	
	GetGlyphIndexes(Text)
	{
		const Indexes = Text.split('').map( c => this.GetGlyphIndex(c) );
		return Indexes;
	}
}

export default FontSdf;
