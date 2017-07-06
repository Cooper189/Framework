var DIR = 'Directive';
var CTRL = 'Controller';
var triangl = {
	register: {},
	directive: function (name, fn) {
		this.register[name] = fn;
	},

	controller: function (name, fn) {
		this.register[name] = fn;
	},
	getRegister: function (name, fn) {
		if(this.temporary[name]) {
			return this.temporary[name]
		}else {
			return this.register[name]
		}
	},
	callCtrl: function (fn, scope) {
		console.log('ctrl', scope.$scope);
		console.log('call fn', fn)
		return fn.apply(null, [scope.$scope]);
	},
	temporary: {
		$rootScope: new ScopeCreator()
	}
}

var DOMCreator = {
	bootstrap: function () {
		this.compiler(document.children[0], triangl.getRegister('$rootScope'))
	},
	compiler: function (el, scope) {
		var nodes = this.getDomEl(el);
		nodes.forEach(function(element) {
			var node = triangl.getRegister(element.name);
			if(typeof(node) === 'function') {
				if(node().scope) {
					console.log(node().scope)
					scope = scope.$new()
				}
				node().link(el, scope, element.value);
			}else{
				return
			}
		});
		for (var i = 0; i < el.children.length; i++) {
			this.compiler(el.children[i], scope);
		}
	},
	getDomEl: function (el) {
		var attr = el.attributes;
		var response = [];
		if (attr.length) {
			for (var i = 0; i<attr.length; i++) {
				response.push(attr[i]);
			}
		}
		return response
	}
}

function ScopeCreator(scope, id) {
	this.$$watcher = [];
	this.$$children = [];
	this.$$parrent = scope;
	this.id = id || 0;
}
var countr = 0;

ScopeCreator.prototype.$new = function () {
	countr++
	var newScope = new ScopeCreator(this,countr);

	Object.setPrototypeOf(newScope, this);
	this.$$children.push(newScope);

	return newScope
}

ScopeCreator.prototype.$eval = function (val) {
	var date = 'return this.'+ val;
	var func = new Function('', date);
	console.log(func)
	return func.call(this)
}

triangl.directive('tg-bind', function () {
	return {
		scope: false,
		link: function (el, scope, val) {
			el.innerHTML  = scope.$eval(val);
		}
	}
});

triangl.directive('tg-controller', function () {
	return {
		scope: true,
		link: function (el, scope, val) {
			var ctrl = triangl.getRegister(val)
			triangl.callCtrl(ctrl, {$scope: scope})
		}
	}
});

triangl.directive('tg-click', function () {
	return {
		scope: false,
		link: function (el, scope, val) {
			console.log('start')
			el.onclick = function (){
				console.log('start')
				scope.$eval(val);
			}
		}
	}
});

triangl.controller('MainCtrl', function ($scope) {
	$scope.local = 'hello';
	$scope.news = 'world';
	$scope.start = function () {
		alert('start app')
	}
})