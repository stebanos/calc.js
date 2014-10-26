'use strict';

var React = require('react');

var DIGIT = 'digit';
var DECIMAL = 'decimal';
var ADD = 'add';
var SUBTRACT = 'subtract';
var DIVIDE = 'divide';
var MULTIPLY = 'multiply';
var EQUALS = 'equals';
var NEGATE = 'negate';
var PERCENTAGE = 'percentage';
var CLEAR = 'clear';

var classNames = {};
classNames[DIGIT] = 'digit';
classNames[DIGIT + '0'] = 'digit digit0';
classNames[DECIMAL] = 'digit';
classNames[ADD] = 'op';
classNames[SUBTRACT] = 'op';
classNames[DIVIDE] = 'op';
classNames[MULTIPLY] = 'op';
classNames[EQUALS] = 'op';
classNames[NEGATE] = 'topOp';
classNames[PERCENTAGE] = 'topOp';
classNames[CLEAR] = 'topOp';

var signs = {};
signs[CLEAR] ='C';
signs[NEGATE] = '\u00b1';
signs[PERCENTAGE] = '%';
signs[DIVIDE] = '\u00f7';
signs[MULTIPLY] = '\u00d7';
signs[SUBTRACT] = '\u2212';
signs[ADD] = '+';
signs[DECIMAL] = '.';
signs[EQUALS] = '=';

var mkNumber = function (n, neg, pct) {
    var string = n === '.' ? '0.' : n;
    var negative = neg === undefined ? false : neg;
    var percentage = pct === undefined ? 0 : pct;
    
    return {
        type: function () {
            return 'start';
        },

        append: function (str) {            
            return mkNumber(string + str, negative, percentage);
        },
        
        negate: function () {
            return mkNumber(string, !negative, percentage);
        },
        
        percentage: function () {
            return mkNumber(string, negative, 1 + percentage);
        },
        
        toString: function () {
            return string || '0';
        },
        
        numberToFloat: function () {
            var neg = negative ? -1: 1;
            var exp = Math.pow(100, percentage);
            return parseFloat(this.toString()) * neg / exp;
        },
        
        equals: function () {
            return this.numberToFloat();
        },
        
        operator: function (fn) {
             return mkOperator(this.numberToFloat(), fn, ZERO);
        },
        
        modify: function (fn) {
            return fn(this);
        },
        
        display: function () {
            return this.numberToFloat();
        },
        
        clear: function () {
            return ZERO;
        }
    };
};

var ZERO = mkNumber('');

var mkOperator = function (n, op, m) {
    return {
        type: function () {
            return 'operator';
        },

        equals: function () {
            return op(n, m === ZERO ? n : m.numberToFloat());
        },

        operator: function (fn) {
            return mkOperator(m === ZERO ? n : this.equals(), fn, ZERO);
        },

        modify: function (fn) {
            return mkOperator(n, op, m.modify(fn));
        },

        display: function () {
            if (m === ZERO) {
                return n;
            } else {
                return m.numberToFloat();
            }
        },

        clear: function () {
            if (m === ZERO) {
                return ZERO;
            } else {
                return mkOperator(n, op, ZERO);
            }
        }
    };
};

var StateObject = function (object) {
    return {
        transformState: function (type, digit) {
            var appendIf = function (isOkay, str) {
                 return function (number) {
                     if (isOkay(number)) {
                         return number.append(str);
                      } else {
                         return number;
                     }
                 };
            };

            var newState;
            if (type === DIGIT) {
                var isShort = function (n) { return n.toString().length < 10; };
                newState = object.modify(appendIf(isShort, digit));
            } else if (type === DECIMAL) {
                var noDot = function (n) { return n.toString().indexOf('.') === -1; };
                newState = object.modify(appendIf(noDot, '.'));
            } else if (type === ADD) {
                newState = object.operator(function (v1, v2) { return v1 + v2; });
            } else if (type === SUBTRACT) {
                newState = object.operator(function (v1, v2) { return v1 - v2; });
            } else if (type === DIVIDE) {
                newState = object.operator(function (v1, v2) { return v1 / v2; });
            } else if (type === MULTIPLY) {
                newState = object.operator(function (v1, v2) { return v1 * v2; });
            } else if (type === EQUALS) {
                newState = mkNumber(String(object.equals()));
            } else if (type === NEGATE) {
                newState = object.modify(function (n) { return n.negate(); });
            } else if (type === PERCENTAGE) {
                newState = object.modify(function (n) { return n.percentage(); });
            } else if (type === CLEAR) {
                newState = object.clear();
            } else {
                return this;
            }
            return StateObject(newState);
        },

        display: function () {
            return object.display();
        }
    };
};

var CommandButton = React.createClass({
    displayName: 'CommandButton',

    onClick: function () {
        this.props.onCommand(this.props.type, this.props.digit);
    },

    render: function () {
        var sign = signs[this.props.type] || this.props.digit;
        var className = classNames[this.props.type + sign] || classNames[this.props.type];
        return React.DOM.div({className: className, onClick: this.onClick}, sign);
    }
});

var Calculator = React.createClass({
    displayName: 'App',

    getInitialState: function () {
        return {
            stateObject: StateObject(ZERO)
        };
    },

    createCommandButton: function (type, digit) {
        return CommandButton({
            type: type,
            digit: digit,
            onCommand: this.onCommand
        });
    },

    render: function () {
        return React.DOM.div(null,
            React.DOM.div({className: 'display'}, this.state.stateObject.display()),
            React.DOM.div({className: 'flex'},
                this.createCommandButton(CLEAR),
                this.createCommandButton(NEGATE),
                this.createCommandButton(PERCENTAGE),
                this.createCommandButton(DIVIDE)),
            React.DOM.div({className: 'flex'},
                this.createCommandButton(DIGIT, 1),
                this.createCommandButton(DIGIT, 2),
                this.createCommandButton(DIGIT, 3),
                this.createCommandButton(MULTIPLY)),
            React.DOM.div({className: 'flex'},
                this.createCommandButton(DIGIT, 4),
                this.createCommandButton(DIGIT, 5),
                this.createCommandButton(DIGIT, 6),
                this.createCommandButton(SUBTRACT)),
            React.DOM.div({className: 'flex'},
                this.createCommandButton(DIGIT, 7),
                this.createCommandButton(DIGIT, 8),
                this.createCommandButton(DIGIT, 9),
                this.createCommandButton(ADD)),
            React.DOM.div({className: 'flex'},
                this.createCommandButton(DIGIT, 0),
                this.createCommandButton(DECIMAL),
                this.createCommandButton(EQUALS)));
    },

    onCommand: function (type, digit) {
        var stateObject = this.state.stateObject.transformState(type, digit);
        this.setState({stateObject: stateObject});
    }
});

exports.init = function (options) {
    React.renderComponent(Calculator(), document.body);
};