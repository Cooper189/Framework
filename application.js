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
	compiler: function (el, scope, flag) {
		var _element
		var nodes = this.getDomEl(el);
		nodes.forEach(function(element) {
			_element = element.name;
			var node = triangl.getRegister(element.name);
			if(typeof(node) === 'function' && element.value !== 'tg-scope') {
				if(node().scope) {
					scope = scope.$new()
				}
				node().link(el, scope, element.value);
			}else{
				return
			}
		});
		for (var i = 0; i < el.children.length; i++) {
			if(_element == 'tg-repeat' && !flag) continue
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
	this.$$watchers = [];
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
	return func.call(this)
}
ScopeCreator.prototype.$watch = function (exp, fn) {
  this.$$watchers.push({
    exp: exp,
    fn: fn,
    last: this.$eval(exp)
  });
};
ScopeCreator.prototype.$digest = function () {
	var dirty, watcher, current, i;
	do {
		dirty = false;
		for (i = 0; i < this.$$watchers.length; i += 1) {
			watcher = this.$$watchers[i];
			current = this.$eval(watcher.exp);
			if (watcher.last != current) {
				watcher.last = current;
				dirty = true;
				watcher.fn(current);
			}
		}
	} while (dirty);
	for (i = 0; i < this.$$children.length; i += 1) {
		this.$$children[i].$digest();
  	}
};
triangl.directive('tg-bind', function () {
	return {
		scope: false,
		link: function (el, scope, val) {
			var _loc = scope.$eval(val);
			el.innerHTML  = _loc || '';
			scope.$watch(val, function (vals) {
        		el.innerHTML = vals;
      		});
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
			el.onclick = function (){
				scope.$eval(val);
				scope.$digest();
			}
		}
	}
});
triangl.directive('tg-repeat', function () {
	return {
		scope: true,
		link: function (el, scope, val) {
			var _scope = scope
			var _current = el;
			el.attributes[0].value = 'tg-scope'
			var _el = el;
			var _data = scope.$eval(val);
			_scope.info = _data;
			for (var i = 0; i<_data.length; i++) {
				scope = _scope.$new()
				scope.$item = _data[i];
				scope.$index = i;
				DOMCreator.compiler(_current, scope, true)
				if(i < (_data.length - 1)) {
					_current.parentNode.appendChild(_el.cloneNode(true));
					_current = _current.nextElementSibling
				}

			}
			
		}
	}
});

triangl.controller('MainCtrl', function ($scope) {
	$scope.local = 'hello';
	$scope.news = 1;
	$scope.start = function () {
		$scope.news++
	}
})
triangl.controller('RepeatCtrl', function ($scope) {
	$scope.base = [
		{name: 'Hello', title: 'Main title'},
		{name: 'World'},
		{name: '!'},
	]
})