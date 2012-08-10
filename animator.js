(function($) {

    var Animator = function(element){
    
	// default frequency
        Animator.frequency = 10;

	//default types of animation
        if ( typeof Animator.animation_types == 'undefined' ) {
            Animator.animation_types = {
                linear: function(value) {
                    return value;
                },
                power: function(value) {
                    return Math.pow(value, 2);
                },
                circ: function(value) {
                    return 1 - Math.sin(Math.acos(value));
                },
                sine: function(value) {
                    return 1 - Math.sin((1 - value) * Math.PI/2);
                },
                back: function(value) {
                    return Math.pow(value, 2) * ((2 + 1) * value - 2);
                },
                bounce: function(value) {
                    for(var a = 0, b = 1, result; 1; a += b, b /= 2) {
                        if (value >= (7 - 4 * a) / 11)
                            return -Math.pow((11 - 6 * a - 11 * value) / 4, 2) + Math.pow(b, 2);
                    }
                }
            }
        }

        if ( typeof Animator.animations == 'undefined' ) {
            Animator.animations = new Array();
        }
	
	// animation
        this.animation = function() {

            for (elementId in Animator.animations) {

                if ( Animator.animations[elementId] ) {

                    var element = Animator.animations[elementId]['element'];

                    var properties = Animator.animations[elementId]['properties'];

                    for (property in properties) {

                        if ( properties[property]['to'] ) {

                            to = properties[property]['to'];

                            delay = properties[property]['delay'];

                            if ( delay >= 0 ) {
                               properties[property]['delay'] = delay - Animator.frequency;
                            }
                            else {

                                if ( !properties[property]['start'] )
                                    properties[property]['start'] = new Date().getTime();

                                value = this.getValue(property, properties[property]);

                                if ( value != to ) {
                                    element.css(property, value);
                                }
                                else {
                                    if (properties[property].callback && typeof(properties[property].callback) === "function") {

                                        callback = properties[property].callback;

                                        setTimeout(function(){callback.call(element)}, 10);
                                    }

                                    element.css(property, to);

                                    delete Animator.animations[elementId]['properties'][property];
                                }
                            }

                            if ( this.getCount(properties) < 1 ) {
                                this.removeAnimation(element);
                            }

                        }
                    }
                }
            }

            if ( Animator.animations ) {
                var current = this;
                setTimeout(function(){
                    current.animation();
                }, Animator.frequency);
            }

        }

	// get progress value for animation
        this.getValue = function(property, params){

            now = ((new Date().getTime()) - params.start);

            var progress = now / params.time;

            if ( progress >= 1 )
                var result = params.to;
            else {

                if ( params.type && Animator.animation_types[params.type] ) {
                    progress = Animator.animation_types[params.type](progress);
                }

                if ( params.to.match(/\#[a-z0-9]*/ig) ) {
			if ( params.from.indexOf('rgb') != -1 ) {
			    var hex_rgb = params.from.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/); 
			    function hex(x) {return ("0" + parseInt(x).toString(16)).slice(-2);}
			    if (hex_rgb) {
				params.from = "#" + hex(hex_rgb[1]) + hex(hex_rgb[2]) + hex(hex_rgb[3]);
			    }
			}
                        var dec2hex = function(dec){return(hexDigit[dec>>4]+hexDigit[dec&15]);}
                        var hexDigit=new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F");
                        var hex2dec = function(hex){return(parseInt(hex,16))};
			
                        var r1=hex2dec(params.from.slice(1,3));
                        var g1=hex2dec(params.from.slice(3,5));
                        var b1=hex2dec(params.from.slice(5,7));
			
                        var r2=hex2dec(params.to.slice(1,3));
                        var g2=hex2dec(params.to.slice(3,5));
                        var b2=hex2dec(params.to.slice(5,7));
			
                        var pc = (100 * progress)/100;

                        r= Math.floor(r1+(pc*(r2-r1)) + .5);
                        g= Math.floor(g1+(pc*(g2-g1)) + .5);
                        b= Math.floor(b1+(pc*(b2-b1)) + .5);

                        var result = "#" + dec2hex(r) + dec2hex(g) + dec2hex(b);
                }
                else {
                     var result = (parseFloat(params.to) - parseFloat(params.from)) * progress + parseFloat(params.from);
                }
            }

            return result;
        }

        this.getCount = function(object) {

            var count = 0;

            for (i in object) {
                if (object.hasOwnProperty(i)) {
                    count++;
                }
            }

            return count;
        }

	// add animations for element
        this.addAnimation = function(element, animations, time, params) {

            if ( time > 0 && element.attr('class') ) {

                var start_animation = false;

                if ( this.getCount(Animator.animations) < 1 )
                    start_animation = true;

                var elementId = this.getElementId(element);

                for (i in animations) {

                    var property = element.css(i);

                    if ( !Animator.animations[elementId] ) {
                        Animator.animations[elementId] = new Array();
                        Animator.animations[elementId]['element'] = element;
                        Animator.animations[elementId]['properties'] = new Array();
                    }

                    Animator.animations[elementId]['properties'][i] = {
                        from: property,
                        to: animations[i],
                        time: time
                    };

                    if ( params ) {
                        if ( params.delay ){
                            Animator.animations[elementId]['properties'][i]['delay'] = params.delay;
                        }

                        if ( params.callback ){
                            Animator.animations[elementId]['properties'][i]['callback'] = params.callback;
                        }

                        if ( params.type ){
                            Animator.animations[elementId]['properties'][i]['type'] = params.type;
                        }
                    }
                }

                if ( start_animation ) {
                    current = this;
                    setTimeout(function(){current.animation();}, Animator.frequency);
                }

            }

        };

	// remove all animations for element
        this.removeAnimation = function(element) {

            var elementId = this.getElementId(element);

	    if ( element.attr('class') ) {
	    
		element.attr('class', jQuery.trim(element.attr('class').replace(/(animate-[0-9]*)/gi, '')));

		delete Animator.animations[elementId];
	    }

        };

	// generate element animation id
        this.getElementId = function(element){

            if ( element.attr('class') ) {
                var regexp = /(animate-[0-9]*)/gi;

                id = element.attr('class').match(regexp);

                if ( !id ) {

                    var newDate = new Date;

                    id = newDate.getTime() + Math.round((newDate.getTime() * Math.random()));

                    id = 'animate-' + id;

                    element.addClass(id);
                }

                return id;
            }

            return false;

        };

	// add type of animation
        this.addType = function(name, type){
            if ( name && typeof(type) === "function" )
                Animator.animation_types[name] = type;
        }
    }

    $.fn.Animator = function(){

        this.animator = new Animator();

        this.addAnimation = function(animations, time, params) {
            this.animator.addAnimation($(this), animations, time, params);
	    
	    return this;
        };

        this.removeAnimation = function() {
            this.animator.removeAnimation($(this));
	    
	    return this;
        };
	
	this.addType = function(name, type) {
	    this.animator.addType(name, type);
	    
	    return this;
	}

        return this;
    };

})( jQuery );