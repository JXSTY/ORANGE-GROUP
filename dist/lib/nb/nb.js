/**
 * Created by PuTi(编程即菩提) 5/22/16.
 */
(function () {
    var interceptors = [];
    //IE 8
    if (!Object.create) {
        Object.create = function (proto, props) {
            if (typeof props !== "undefined") {
                throw "The multiple-argument version of Object.create is not provided by this browser and cannot be shimmed.";
            }
            function ctor() {
            }

            ctor.prototype = proto;
            return new ctor();
        };
    }
    var pkg = function () {
        return {};
    };

    var RootType;

    var label = function (inName, inTarget) {
        var handler = window;
        var last;
        if (inName) {
            var names = inName.split('.');
            last = names.pop();
            $.each(names, function (inIndex, inName) {
                var temp = handler[inName];
                if (temp) {
                    handler = temp;
                    return;
                }
                handler = handler[inName] = new pkg();
            });
        }
        if (last) {
            handler[last] = inTarget;
        }
        return inTarget;
    };

    var get = function(inName,inTarget){
        var target = inTarget || window;
        var result = target;
        if(inName){
            var names = inName.split('.');
            $.each(names,function(inIndex,inName){
                result = target = target[inName];
                if(!result){
                    return false;
                }
            });
        }
        return result;
    };


    var define = function (inDef,inIgnoreInterceptor) {
        var name = inDef['name'];
        var view = inDef['view'];
        var parent = inDef['parent'];
        if (parent) {
            if (typeof parent === 'string') {
                var parentName = parent;
                parent = get(parent);
                if(!parent){
                    throw 'Parent not found!['+parentName+']';
                }
            }
        }

        if(!inIgnoreInterceptor){
            $.each(interceptors,function(inIndex,inInerceptor){
                parent = inInerceptor.fn.call(inInerceptor.scope,inDef,parent);
            });
        }


        var type = extend(parent || RootType, inDef);
        if (name) {
            return label(name, type);
        } else {
            return type;
        }
    };

    var extend = function (inSuper, inDef) {
        var superPrototype = inSuper.prototype;
        var prototype = Object.create(superPrototype);

        var Type = function () {
            var init = this.init;
            if (init) {
                init.apply(this, arguments);
            }
        };

        $.each(inDef, function (inName, inProp) {
            if (inName == 'method') {
                extendMethods(prototype, inProp);
            } else {
                prototype[inName] = inProp;
            }
        });

        Type.prototype = prototype;
        return Type;
    };


    var extendMethods = function (inPrototype, inMethods) {
        var methods = inMethods || {};
        $.each(methods, function (inName, inMethod) {
            var prop = inPrototype[inName];
            if (prop != undefined && typeof prop == "function") {
                if(inName === 'init'){
                    inPrototype[inName] = (function (superFn, fn) {
                        return function () {
                            superFn.apply(this,arguments);
                            return fn.apply(this, arguments);
                        };
                    })(prop, inMethod);
                }else{
                    //overwrite or override
                    inPrototype[inName] = (function (superFn, fn) {
                        return function () {
                            this.parent = superFn;
                            return fn.apply(this, arguments);
                        };
                    })(prop, inMethod);
                }
            } else {
                inPrototype[inName] = inMethod;
            }
        });
    };

    var Type = function () {
    };
    RootType = extend(Type, {
        /**
         *  name:,
         *  scope:
         *  fn:function
         * @param inOpts
         */
        on: function (inOpts) {
            var eventMap = this.__eventMap;
            var name = inOpts.name;
            var scope = inOpts.scope;
            var fn = inOpts.fn;
            var array;
            if (!eventMap) {
                eventMap = this.__eventMap = {};
            }
            array = eventMap[name];
            if (!array) {
                array = eventMap[name] = [];
            }
            array.push({
                scope: scope,
                fn: fn
            });
        },
        fire: function (inName, inData) {
            var eventMap = this.__eventMap;
            var eventArray = (eventMap ? eventMap[inName] : []) || [];
            $.each(eventArray, function (inIndex, inOpts) {
                var scope = inOpts.scope;
                var fn = inOpts.fn;
                fn.call(scope, inData);
            });
        },
        getHandler:function(inKey){
            var handler = this[inKey+'Handler'];
            if(!handler){
                throw new Error('Handler nout found.['+inKey +']');
            }
            return handler;
        }
    });

    var addDefineInterceptor=function(inInterceptor){
        interceptors.push(inInterceptor);
    };

    var nb = window.nb = {};
    nb.name = label;
    nb.define = define;
    nb.extend = extend;
    nb.addDefineInterceptor = addDefineInterceptor;
    nb.get = get;
})();
/**
 * Created by PuTi(编程即菩提) 5/23/16.
 */
(function () {
    var Model = nb.define({
        name: 'nb.Model',
        method: {
            init: function () {
                this.__model = {};
                this.__eventMap = {};
            },
            set: function (inName, inData, inOpts) {
                var model = this.__model;
                var origin = model[inName];
                var map = this.__eventMap;
                var events = map[inName];
                var eventArray = (events ? events['before'] : []) || [];
                var data = {
                    name: inName,
                    origin: origin,
                    data: inData
                };
                var skipSameValue = inOpts? inOpts.skipSameValue:true;
                var noBefore = inOpts? inOpts.noBefore:false;

                if (skipSameValue && inData == origin) {
                    return;
                }
                if (noBefore != true) {
                    $.each(eventArray, function (inIndex, inOpts) {
                        var scope = inOpts.scope;
                        var fn = inOpts.fn;
                        fn.call(scope, data);
                    });
                }
                model[inName] = inData;
                eventArray = (events ? events['after'] : []) || [];
                $.each(eventArray, function (inIndex, inOpts) {
                    if (!inOpts) {
                        return;
                    }
                    var scope = inOpts.scope;
                    var fn = inOpts.fn;
                    var once = inOpts.once;
                    fn.call(scope, data);
                    if (once) {
                        delete eventArray[inIndex];
                    }
                });
            },
            get: function (inName) {
                return this.__model[inName];
            },
            /**
             * {
             *  name:model name,
             *  type:before/after(default),
             *  scope:
             *  fn:function
             * }
             * @param inOpts
             */
            onChange: function (inOpts) {
                var map = this.__eventMap;
                var name = inOpts.name;
                var type = inOpts.type || 'after';
                var once = inOpts.once;
                var scope = inOpts.scope;
                var fn = inOpts.fn;
                var events = map[name];
                var typeArray;

                if (!events) {
                    events = {};
                    map[name] = events;
                }
                typeArray = events[type];
                if (!typeArray) {
                    typeArray = [];
                    events[type] = typeArray;
                }
                typeArray.push({scope: scope, fn: fn, once: once});
            }
        }
    });
})();
/**
 * Created by PuTi(编程即菩提) 5/22/16.
 */
(function () {
    var contentHandlerMap = {
        'string': function (inOpts) {
            var $el = inOpts.$;
            var tag = $el.prop('tagName').toLowerCase();
            var content = inOpts.content;
            if (tag == 'input') {
                $el.val(content)
            } else {
                $el.text(content);
            }
        },
        'object': function (inOpts) {
            var content = inOpts.content;
            var root = inOpts.root;
            var child = define(content, root);
            var name = content['$name'];
            var $el = child.$();
            inOpts.$.append($el);
            if (name) {
                var key = '$' + name;
                var temp = root[key];
                if (temp) {
                    if ($.type(temp) != 'array') {
                        var array = [temp];
                        temp = root[key] = array;
                    }
                    temp.push(child)
                } else {
                    root[key] = child;
                }
            }
        },
        'array': function (inOpts) {
            $.each(inOpts.content, function (inIndex, inContent) {
                content({
                    $: inOpts.$,
                    container: inOpts.container,
                    root: inOpts.root,
                    content: inContent
                });
            });
        },
        'undefined': function () {
            //do nothing
        }
    };
    var content = function (inOpts) {
        var content = inOpts['content'];
        var type = $.type(content);
        contentHandlerMap[type](inOpts);
    };
    var attrHandlerMap = {
        'class': function (inObj, in$El, inJson, inRoot) {
            var cls = inJson['class'];
            if (cls) {
                in$El.addClass(cls);
            }
        },
        'style': function (inObj, in$El, inJson, inRoot) {
            var style = inJson['style'];
            if (style) {
                in$El.css(style);
            }
        },
        'content': function (inObj, in$El, inJson, inRoot) {
            content({
                $: in$El,
                container: inObj,
                root: inRoot || inObj,
                content: inJson.content
            });
        },
        binder: function (inObj, in$el, inJson, inRoot) {
            var container = inRoot || inObj;
            var binders = container.binders = container.binders || [];
            binders.push({
                $: in$el,
                def: inJson.binder
            });
        }
    };
    var find = function (inName, inType) {
        var obj;
        if (inName != undefined) {
            obj = this['$' + inName];
            if(!obj){
                throw new Error('Child not found.Please check the $name property.['+inName +']')
            }
        } else {
            obj = this;
        }
        if (!inType) {
            obj = obj['$root'] || obj.__viewInstance['$root'];
        }
        return obj;
    };
    var define = function (inJson, inRoot) {
        var obj;
        if (inJson['$type']) {
            obj = define4Type(inJson, inRoot);
        } else if (inJson['$template']) {
            obj = define4Template(inJson, inRoot);
        } else {
            obj = define4JSON(inJson, inRoot);
        }
        return obj;
    };
    var define4Template = function (inJson, inRoot) {
        //TODO no implement
    };
    var define4Type = function (inJson, inRoot) {
        var type = inJson['$type'];
        var opts = inJson['$opts'];
        if (typeof type === 'string') {
            var name = type;
            type = nb.get(name);
            if(type == null){
                throw 'Type not found['+name+']'
            }
        }
        var obj = new type;
        if(opts){
            obj.setOpts(opts);
        }
        return obj;
    };
    var define4JSON = function (inJson, inRoot) {
        var obj = {
            $: find
        };
        if ($.isArray(inJson)) {
            var $el = $('<div>');
            $.each(inJson, function (inIndex, inChild) {
                var name = inChild.$name;
                var child = define4JSON(inChild, obj);
                if (name) {
                    obj['$' + name] = child;
                }
                $el.append(child.$());
            });
            obj.$root = $el.children();
        } else {
            obj.$root = createEl(obj, inJson, inRoot);
        }
        return obj;
    };
    var createEl = function (inObj, inJson, inRoot) {
        var tag = inJson.tag || 'div';
        var $el = $('<' + tag + '>');
        $.each(inJson, function (inName, inValue) {
            var name = inName.toLowerCase();
            if (name == 'tag') {
                return true;
            }
            var fn = attrHandlerMap[inName];
            if (fn) {
                fn(inObj, $el, inJson, inRoot);
            } else {
                if (name.indexOf('$') === 0) {
                    $el.attr('data-nb-' + name.substring(1), inValue);
                } else {
                    $el.attr(name, inValue);
                }
            }
        });
        return $el;
    };

    var init = function () {
        var self = this;
        var view = this.view;
        var viewInstance;
        var binders;
        if (view) {
            viewInstance = this.__viewInstance = define(view);
        }
        if (viewInstance) {
            binders = viewInstance.binders;
            if (binders && binders.length > 0) {
                var model = this.__model = new nb.Model();
                $.each(binders, function (inIndex, inBinder) {
                    var $el = inBinder.$;
                    var tag = $el.prop('tagName');
                    var def = inBinder.def;
                    $el.on('keyup', function (inEvent) {
                        var $this = $(this);
                        var value = $this.val();
                        var key = def.key;
                        model.set(def.key, value, {
                            skipSameValue: true
                        });
                    });
                    model.onChange({
                        name: def.key,
                        scope: self,
                        fn: function (inEvent) {
                            var value = inEvent.data;
                            var oldValue;
                            if (tag == 'INPUT') {
                                oldValue = $el.val();
                            } else {
                                oldValue = $el.text();
                            }
                            if (value != oldValue) {
                                if (tag === 'INPUT') {
                                    $el.val(value);
                                } else {
                                    $el.text(value);
                                }
                            }
                        }
                    });
                });
            }
        }
    };

    var viewFind = function (inName, inType) {
        return this.__viewInstance.$(inName, inType);
    };
    var setModel = function (inModel) {
        this.__model = inModel;
    };
    var getModel = function () {
        return this.__model;
    };
    nb.addDefineInterceptor({
        scope: this,
        fn: function (inDef, inParent) {
            if (!inDef || !inDef.view) {
                return inParent;
            }
            if (inParent && inParent.prototype.view) {
                return nb.define({
                    parent: inParent,
                    method: {
                        $: viewFind,
                        getModel: getModel,
                        setModel: setModel
                    }
                }, true);
            }
            return nb.define({
                parent: inParent,
                method: {
                    init: init,
                    $: viewFind,
                    getModel: getModel,
                    setModel: setModel
                }
            }, true);
        }
    })
})();