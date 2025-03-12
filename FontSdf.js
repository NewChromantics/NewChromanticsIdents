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
}

export default FontSdf;
