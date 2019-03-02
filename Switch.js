function CrSwitch(name_class, ids){
	if(Array.isArray(ids)){
		var elems = ids.map(getNode);
		elems = elems.map(elem => elem.classList);

		return arrSwicth.bind(null, elems, name_class);
	}
	else if(typeof ids == "object"){
		return objSwitch(ids, name_class);
	}
	else{
		var elem = getNode(ids).classList;
		return oneSwitch.bind(null, name_class, elem);
	}
	
}

function objSwitch(id_obj, class_name){
	for (var key in id_obj){
		id_obj[key] = getNode(id_obj[key]).classList;
	}

	return function(id){
		for (var i in id_obj){
			id_obj[i].add(class_name);
		}
		
		id_obj[id].remove(class_name);
	}
}

function arrSwicth(elem_arr, name_class){
	elem_arr.forEach(oneSwitch.bind(null, name_class));
}

function oneSwitch(name_class, elem){
		elem.toggle(name_class);
}

module.exports = CrSwitch;

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}