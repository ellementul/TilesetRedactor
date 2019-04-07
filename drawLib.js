exports.drawTile = function(svg_img){
	
	var img = document.createElement('img');
	img.src = "data:image/svg+xml;base64,"+ Base64.encode(svg_img);

	img.classList.add("tile");
	
	return img;
}

exports.getNode = function(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}