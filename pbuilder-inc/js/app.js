/* pbuilder assets path */
var assets_path = "pbuilder-assets/";
var upload_path = "pbuilder-upload/";

/*clear localsorage*/
localStorage.clear();

var new_object = [{
		"title": "Propably best new article on the internet!",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "background": upload_path+"unsplash.example2.jpeg",
        "linkname": "Learn more",
        "linktarget": "html://google.com"
   	}];

var loadFile = function (callback, file) {
    var xobj = new XMLHttpRequest();
    //xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); 
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
        if(xobj.readyState == 4 && xobj.status == "403") {        	
        	console.log('loadFile:error 403');
        }
        if(xobj.status == "404") {  
        	alert('FATAL ERROR\n'+file+' \nDOESNT EXIST')
        }
    };
    xobj.send(null);  
}
/* on first load clear elements with section (if databese have elements to render) */
var _clear_at_start = function(data){
	/* hardocoded alweays clear elements-agregator */
	//delete data['elements-agregator'];
	//data['elements-agregator'] = {'elements':[]};
	return data;
}
var _PBuilder = {
	'dragobj':{},
	'data':{},
	'schema':{},
	'loaded_components':{},
	'load_counter':0,
	'move_element':{
		'from':{
			'section':'section_id',
			'index':0
		},
		'to':{
			'section':'section_id',
			'index':0
		}
	},
	/* 1 INIT - load content data */
	init: function(schema){
		

		_this = this; _this.schema = schema; this.load_counter = 0;
		/* Render App from file*/
		if(localStorage.actual_landing_data){
			this.init_Callback(JSON.parse(localStorage.actual_landing_data));
		}else{
			loadFile( function(response) {
				localStorage.actual_landing_data = response;
				_this.init_Callback(JSON.parse(response));
			}, assets_path+'data-base/composition1.json');
		} 		
	},
	/* 2 INIT callback - update app object */
	init_Callback : function(data){
		/* build data model */
		console.log('-- run render constructor --');
		this.data = data;
		this.data = _clear_at_start(data);
		this.load_components();
	},	
	/* 3 Load components (templates) to render */
	load_components: function(){
		/* TODO & WARNING - dont load loaded (existing) components */
		console.log('## LOAD COMPONENTS ##');
		console.log(this.schema);
		_this = this;
		var section_name = Object.keys(this.schema)[this.load_counter];
		console.log('section_name:'+section_name);
		if(section_name == undefined){
			console.log('components loaded');
			this.load_components_callback();
		}else{
			var comp_name = this.schema[ section_name ]['default_component'];
			console.log('load compoent:'+comp_name);
			loadFile( function(response) {
				var schema_el_length = Object.keys(_this.schema).length;
				_this.loaded_components[comp_name] = response;
				_this.load_counter++;
				_this.load_components();
			}, assets_path + 'components/' + comp_name + '.doT.html'); 
		}
	},
	/* 3 Load components callback - RUN APP */
	load_components_callback: function(){
			
		/* render defaults components */
		var to_drag_and_drop = [];
		for (section in this.schema){			
			/* set editable section */
			if(this.schema[section].new){
				out = '<div onclick="_PBuilder.add_new(this)" style="position:absolute; margin-left:-1.1em; font-size:2em; text-shadow:0 0 1px #fff" data-add="'+section+'">';
				out += '<i class="material-icons">&#xE146;</i></div>';
				document.getElementById(section).outerHTML += out;
				//document.getElementById(section).className += " section_add";
				//document.getElementById(section).onclick = this.add_new;				
			}
			/* get templates and render it */
			var tpl_part = this.loaded_components[this.schema[section]['default_component']];	
			var content = this.data[ this.J_kIx(section) ];
			if(content){
				this.data[ this.J_kIx(section) ].elements.forEach(function (data, i) {
			   		_PBuilder.render(data, tpl_part, section);
				});
			}
			if(this.schema[section].dragdrop){
				to_drag_and_drop.push(document.getElementById(section));
			}
		}	
		/* ------------- */
		/* DRAG AND DROP */	
		var min = 0;
		this.dragobj = dragula(to_drag_and_drop
		).on('drag', function (el) {
			min = document.getElementById("page-builder").offsetHeight;
			document.getElementById("page-builder").style['min-height']=min;
			_bTrform.off();
			_PBuilder.moved_element(el,'from');
		}).on('drop', function (el) {
			_bTrform.on();
			_PBuilder.moved_element(el,'to');
			save_local_grid();
		});	

	},
	/* Load new boilerplate */
	load_html : function(packagename){
				
		loadFile( function(html_response) {



			document.getElementById("page-builder").innerHTML = html_response;
			var tag = document.createElement("script");
			tag.src = assets_path + 'boiler-plates/' + packagename + '/site-script.js';
			document.getElementsByTagName("head")[0].appendChild(tag);

		}, assets_path + 'boiler-plates/' + packagename + '/site.html'); 
	},	
	render: function(data, tpl_part, target){

		var out = '';
		out += '<div class="gr-body">';
		/* check is this section have delete */		
		if(this.schema[target].remove){
			out += '<div class="remove" onclick="_PBuilder.remove(this,\''+this.schema[target].remove+'\')"><a href="#none"><i class="material-icons">&#xE92B;</i></a></div>';
		}
		if(this.schema[target].edit_this){
			out += '<div class="edit" onclick="_PBuilder.edit(this); return false"><a href="#openModal"><i class="material-icons">&#xE254;</i></a></div>';
		}
		out += tpl_part;
		out += '</div>';
		out = out.replace(/\\"/g, '"');
		/* create data */
		var tempHTML = doT.template(out);
		var tempCONTENT = data;
		
		/* rebuild exist element */
		var elements = document.getElementById(target).children;
		for( var i = 0; i<elements.length; i++){
			if(elements[i].classList.contains('gu-transit')){
				elements[i].outerHTML = tempHTML(tempCONTENT);
				return false;
			};
		}
		/* add new element */
		document.getElementById(target).innerHTML += tempHTML(tempCONTENT);
	},
	/* ------------------------ */
	/* drag and drop controller */
	/* ------------------------ */
	
	/* create dragged element start and end point to rebuild json data base object */
	moved_element:function(el,type){
		this.move_element[type].section = el.parentNode.id;
		this.move_element[type].index = this.DOM_Ix(el);
    	if(type == 'to'){
    		this.update_data_after_move();    		
    	}    	
    	return this.move_element;
	},
	update_data_after_move: function(){
		/* get */
		var valut_obj = this.data[ this.J_kIx( this.move_element.from.section) ].elements[this.move_element.from.index];
		/* remove */
		this.data[ this.J_kIx( this.move_element.from.section) ].elements.splice(this.move_element.from.index, 1);
		/* add */
		this.data[ this.J_kIx( this.move_element.to.section) ].elements.splice(this.move_element.to.index, 0, valut_obj);
		/* --------- */
		/* check if i should change template */
		if(this.schema[this.move_element.to.section]['extended_default_component']){
			var tpl_part = this.loaded_components[ this.schema[this.move_element.to.section]['default_component'] ];
			this.render(
				valut_obj,
				this.loaded_components[ this.schema[this.move_element.to.section]['default_component'] ], 
				this.move_element.to.section
			);
		}
	},

	/* ------------------------ */
	/* actions */
	/* ------------------------ */

	remove: function(el,target){
		var wraper = getClosest(el, '.gr-body');
		this.J_delete(wraper.parentNode.id, this.DOM_Ix( wraper ));
		wraper.parentNode.removeChild(wraper);
		/*save_local_grid();*/
	},
	'e_obj':{
		'section':{},
		'section_index':{},
		'element':{},
		'element_index':{},
		'controls':{},
		'data_fragment':{}
	},
	add_new:function(el) {
		// this to ma byc sekcja;
		var _t = document.getElementById(el.getAttribute("data-add"));
		var tpl_part = _PBuilder.loaded_components[_PBuilder.schema[_t.id]['default_component']];	
		var content = _PBuilder.data[ _PBuilder.J_kIx(_t.id) ];
		
		if(content){
			document.getElementById(_t.id).innerHTML = "";
			var new_section = new_object.concat(content.elements); 
			new_section.forEach(function (data, i) {
		   		_PBuilder.render(data, tpl_part, _t.id);
			});
			content.elements = new_section;
		}else{
			//alert('iam empty i chuj');
		}
	},	
	edit:function(el){
		//document.getElementById('page-builder-wraper').classList.toggle('blur');
		window.location.hash = '#openModal';
		this.e_obj.section = getClosest(el, 'section');
		this.e_obj.section_index = this.J_kIx(this.e_obj.section.id);
		this.e_obj.element = getClosest(el, '.gr-body');
		this.e_obj.element_index = this.DOM_Ix( this.e_obj.element );
		this.e_obj.constrols = this.e_obj.element.querySelectorAll('.toedit');
		this.e_obj.data_fragment = this.data[this.e_obj.section_index].elements[this.e_obj.element_index];
		

		/* render form */
		this.build_elem_form(this.e_obj);
		/* TODO & WARNING - always run uploader if run edit window */
		var myDropzone = new Dropzone("div#dropzone", { 
			url: "pbuilder-upload.php",
			thumbnailWidth: "400"
		});

		myDropzone.on("complete", function(file) {
			//remove background example
			//myDropzone.removeFile(file);
			document.getElementById('exist-preview').style.display = 'none';
			document.getElementById('dropzone').setAttribute("value", upload_path+file.name); 

		});
	},
	build_elem_form: function(e_obj){
		this.e_obj = e_obj;
		var out = '<div id="editor-wraper" onkeypress="_PBuilder.editor_keypress(event)">';
		for( var i = 0; i<this.e_obj.constrols.length; i++){
			if(this.e_obj.constrols[i].classList.contains('text')){
				out += '<input data-edit-controll="true" name="'+this.e_obj.constrols[i].getAttribute("data-key")+'" value="'+this.e_obj.constrols[i].innerHTML+'" ><br>';
			}
			if(this.e_obj.constrols[i].classList.contains('textarea')){
				out += '<textarea data-edit-controll="true" name="'+this.e_obj.constrols[i].getAttribute("data-key")+'">'+this.e_obj.constrols[i].innerHTML+'</textarea><br>';
			}
			if(this.e_obj.constrols[i].classList.contains('background')){
				
				out += '<div id="dropzone" data-edit-controll="true" name="'+this.e_obj.constrols[i].getAttribute("data-key")+'" value="'+this.e_obj.data_fragment[this.e_obj.constrols[i].getAttribute("data-key")]+'">';
				out += 'add or edit background';
				out += '<div id="exist-preview" style="background-image:url(\''+this.e_obj.data_fragment.background+'\')"></div>';
				out += '</div>';
			}
			console.log(this.e_obj.data_fragment);
		}
		/* parse template */
		/*var usage_template = this.loaded_components[this.schema[section.id]['default_component']];
		var result = usage_template.match(/{{=it.(.*?)}}/g).map(function(val){
			alert(val);
			return val.replace(/<\/?b>/g,'');
		});*/
		out += '<a id="save-content" onclick="_PBuilder.editor_save()" href="#close">Save</a>';
		out += '</div>';
		document.getElementById('modal-content').innerHTML = out;
	},
	editor_keypress: function(e){
		if (e.keyCode == 13) {
			this.editor_save();
			window.location.hash = '#close';
		}
	},
	editor_save:function(){
		var edited_controlls = document.querySelectorAll('[data-edit-controll]');
		console.log("edited_controlls");	
		console.log(edited_controlls);
		for( var i = 0; i<edited_controlls.length; i++){
			
			if( edited_controlls[i].getAttribute("name")=='background'){
				
				var _name = edited_controlls[i].getAttribute("name");
				var _value = edited_controlls[i].getAttribute("value");
			
			}else{
				
				var _name = edited_controlls[i].name;
				var _value = edited_controlls[i].value;
			
			}
			/* update JSON */
			this.data[this.e_obj.section_index].elements[this.e_obj.element_index][_name] = _value;
			/* update DOM */
			if(document.querySelector("[data-key="+_name+"]") != null){
				
				if(_name == 'background'){
					var out = "background-image:url('"+_value+"');";
					this.e_obj.element.querySelector("[data-key="+_name+"]").setAttribute('style',out);
				}else{
					this.e_obj.element.querySelector("[data-key="+_name+"]").innerHTML = _value;
				}
				
			}
			
		}
		save_local_grid();
		//console.log(this.J_kIx(this.edited_obj.section));
		//var out = document.getElementById('text-editor').value;
		//out = out.replace(/<br\s*\/?>/mg,"\n");
		//this.edited_obj['edited-node'].innerHTML = out;
		//this.data[this.J_kIx(this.edited_obj.section)].elements[this.edited_obj.DOMsectionIndex].desc = out;
	},

	/* ------------------------ */
	/* tech */
	/* ------------------------ */
	/* get key index */
	J_kIx: function(key, shema){
		if(shema == undefined){
			var obj = this.schema; 
		}		
		return Object.keys(obj).indexOf(key);
	},
	J_delete: function(section, index){
		this.data[this.J_kIx( section)].elements.splice(index, 1);
	},
	DOM_Ix: function(el){
     	return Array.prototype.indexOf.call(el.parentNode.children, el);
	},

	/* ###################################################################################### */
	/* JSON MANIPULATIONS */
	J_merge: function(section, data){

		/* J_merge */
		//var tech_array = data.concat(this.data[section].elements); 
		//this.data[section].elements = tech_array;
		
		/* overwrite */
		this.data[section].elements = data;
		this.templating_data(section);
	},
}

var save_local_grid = function(){
	
	console.log('-- storage data on local browser object --');
	localStorage.actual_landing_data =  JSON.stringify(_PBuilder.data);

	console.log('-- console log --');
	var str = JSON.stringify(_PBuilder.data, null, 2);
	document.getElementById('inspector-content').innerHTML = "##:DATA\n";
	document.getElementById('inspector-content').innerHTML += str;
	var str = JSON.stringify(_PBuilder.schema, null, 2);
	document.getElementById('inspector-content').innerHTML += "\n\n##:SHEMA\n";
	document.getElementById('inspector-content').innerHTML += str;
	var str = JSON.stringify(_PBuilder.move_element, null, 2);
	document.getElementById('inspector-content').innerHTML += "\n\n##:DRAG AND DROP\n";
	document.getElementById('inspector-content').innerHTML += str;
}
/* CLIMBING UP TECH FUNCTION */
/*
http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
*/
var getClosest = function (elem, selector) {
    var firstChar = selector.charAt(0);
    // Get closest match
    for ( ; elem && elem !== document; elem = elem.parentNode ) {
        // If selector is a class
        if ( firstChar === '.' ) {
            if ( elem.classList.contains( selector.substr(1) ) ) {
                return elem;
            }
        }
        // If selector is an ID
        if ( firstChar === '#' ) {
            if ( elem.id === selector.substr(1) ) {
                return elem;
            }
        } 
        // If selector is a data attribute
        if ( firstChar === '[' ) {
            if ( elem.hasAttribute( selector.substr(1, selector.length - 2) ) ) {
                return elem;
            }
        }
        // If selector is a tag
        if ( elem.tagName.toLowerCase() === selector ) {
            return elem;
        }
    }
    return false;
};


function gui_designers(){
	document.getElementById('gui_zoom_button').classList.toggle('active');
	if(document.getElementById('gui_zoom_button').classList.contains("active")){
		_bTrform.init();
			
	}else{
		_bTrform.destroy();
	}
	window.location.href="#";
}

function gui_save(){
	var data = window.btoa(JSON.stringify(_PBuilder.data));
	var schema = window.btoa(JSON.stringify(_PBuilder.schema));
	window.location.href="#openModal";
	out = "Generating static WebPage now...<br>Please wait...";
	document.getElementById('modal-content').innerHTML = out;
	
	loadFile( function(response) {		
			out = "<b>Your site was created on:</b><br/>";
			out += "http://micromarket.io/pbuilder-upload/"+window.transaction_id;
			out += "<p>Copy this link and enjoy!!</p>";
			document.getElementById('modal-content').innerHTML = out;
			//document.getElementById('body').innerHTML = response;
			//localStorage.actual_landing_data = response;
			//_this.init_Callback(JSON.parse(response));
	}, 'render-static.php?data='+data+'&schema='+schema+'&tid='+window.transaction_id);
}
