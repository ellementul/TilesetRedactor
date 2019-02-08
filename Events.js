function CrEvnets(List){
	var Clicks = List.clicks;
	var Submits = List.submits;
	
	for(var id in Clicks){;
		getNode(id).onclick = Clicks[id];
	}
	
	for(id in Submits){;
		getNode(id).onsubmit = Submit(Submits[id]);
	}
}

function Submit(func){
	return function(event){
		event.preventDefault();
		func.apply(this, arguments);
	}
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}

module.exports = CrEvnets;
