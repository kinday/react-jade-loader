'use strict';

var uglify = require('uglify-js');
var camelCase = require('lodash').camelCase;

module.exports = Hoister;
function Hoister(options) {
  this.requires = {};
  uglify.TreeTransformer.call(this, this.before, this.after);
};

Hoister.prototype = Object.create(uglify.TreeTransformer.prototype);

Hoister.prototype.after = function (node) {
  if (node instanceof uglify.AST_Toplevel) {
    if (Object.getOwnPropertyNames(this.requires).length) {
      var defs = new uglify.AST_Var({
        definitions: Object.keys(this.requires).map(function (key) {
          var def = this.requires[key];
          return new uglify.AST_VarDef({
            name: new uglify.AST_SymbolVar({ name: def.name }),
            value: def.node
          });
        }.bind(this))
      });
      node.body.unshift(defs);
    }
    return node;
  }
  if (this._isRequire(node)) {
    return this._hoist(node);
  }
  if (this._isRequireLocal(node)) {
    return new uglify.AST_Undefined({
      start: node.start,
      end: node.end
    });
  }
}

Hoister.prototype._isRequire = function (node) {
  if (node instanceof uglify.AST_Call) {
    if (node.expression.name === 'require') {
      return true;
    }
  }
  return false;
}

Hoister.prototype._isRequireLocal = function (node) {
  if (node instanceof uglify.AST_Conditional) {
    if (node.condition.operator && node.condition.operator === 'in') {
      if (node.condition.left.value === 'require') {
        return true;
      }
    }
  }
  return false;
}

Hoister.prototype._hoist = function (node) {
  var value = this._getValue(node);
  var name = this._getName(value);
  if (!this.requires[value]) {
    this.requires[value] = {
      name: name,
      node: node
    };
  }
  return new uglify.AST_SymbolRef({
    start: node.start,
    end: node.end,
    name: name
  });
}

Hoister.prototype._getName = function (value) {
  return camelCase('require-' + value);
}

Hoister.prototype._getValue = function (node) {
  return node.args[0].value;
}
