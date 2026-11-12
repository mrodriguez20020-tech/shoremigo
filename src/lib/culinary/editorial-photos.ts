/** Additional real, openly licensed editorial images. Originals remain on Wikimedia Commons.
 * These do not represent actual servings at a fictional ShoreMigo venue. */
const entries = [
 ["roti","Dhalpurie_Roti,_Channa_and_Potato,_Curry_Shrimp,_Trinidad_and_Tobago.JPG","d0","Kalamazadkhan","by-sa/3.0",3879,3103,960],
 ["bake-shark","MISC_Bake_&_Shark.jpg","e1","Grueslayer @Wikipedia","by-sa/4.0",4320,3240,960],
 ["pelau","MISC_Pelau.jpg","6c","Grueslayer @Wikipedia","by-sa/4.0",4320,3240,960],
 ["marquesita","Marquesitas.jpg","25","Mike and Lara Wolfe","zero/1.0",4032,3024,960],
 ["baleada","Baleada_SPS.jpg","f2","Ronny Medina","by/4.0",780,717,0],
 ["ackee","Jamaican_Ackee_and_Saltfish.jpg","d4","Sumit Surai","by-sa/4.0",7088,4736,960],
 ["sorrel","Homemade_sorrel_drink.jpg","61","stu_spivack","by-sa/2.0",1168,1760,960],
 ["mauby","Mauby-fizzz-bottle-glass.jpg","cf","Ryan Chen-Wing","by/2.5",643,1023,0],
 ["sample-desserts-coconut-ice-cream","Coconut_Ice_Cream.jpg","36","Anilakeo","by-sa/4.0",2448,3264,960]
] as const;
export const EDITORIAL_PHOTOS = entries.map(([id,file,hash,author,license,sourceWidth,sourceHeight,width]) => {
 const encoded = encodeURIComponent(file);
 const originalUrl = "https://upload.wikimedia.org/wikipedia/commons/"+hash[0]+"/"+hash+"/"+encoded;
 return {id,title:"File:"+file.replaceAll("_"," "),source:"https://commons.wikimedia.org/wiki/File:"+encoded,author,
 license:license.startsWith("zero")?"CC0 1.0":"CC "+license.replace("by-sa","BY-SA").replace("by","BY").replace("/"," "),
 licenseUrl:"https://creativecommons.org/"+(license.startsWith("zero")?"publicdomain/":"licenses/")+license+"/",
 sourceWidth,sourceHeight,originalUrl,
 remoteUrl:width?"https://thumb.wikimedia.org/wikipedia/commons/thumb/"+hash[0]+"/"+hash+"/"+encoded+"/"+width+"px-"+encoded:originalUrl,
 changes:"Responsive crop; Wikimedia thumbnail where available."};
});
