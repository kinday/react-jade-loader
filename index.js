var jade = require('react-jade')
  , path = require('path')
  , uglify = require('uglify-js')
  , Hoister = require('./hoister')
  , loaderUtils = require('loader-utils');

module.exports = function(source){

  var result;
  var transform = '';

  this.cacheable && this.cacheable();

  var filepath = loaderUtils.getRemainingRequest(this).replace(/^!/, "");
  var query = loaderUtils.parseQuery(this.query);

  if(query.split){
    var chunks = source.split(/\n*?\/\/ react: (\w+)\s*\n/);
    chunks.shift();
    if(!chunks.length) return single();

    for(var i=0; i < chunks.length-1; i += 2){
      transform += "exports['" + chunks[i] + "'] = " + jade.compile(chunks[i+1], {filename: filepath}).toString() + ";\n";
    }
    result = transform;
  } else {
    result = transform + "module.exports= " + jade.compile(source, {filename: filepath}).toString();
  }

  // hoist requires
  result = uglify.parse(result);
  result.figure_out_scope();
  result = result.transform(new Hoister());
  result = result.print_to_string({
    beautify: true,
    comments: true,
    indent_level: 2
  });
  return "var React = require('react');\n" + result;

}
