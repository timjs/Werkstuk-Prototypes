
var fs = require("fs"),
    _ = require("./underscore-min"),
    tokenize = require("./lexer"),
    parse = require("./parser");

var files = [
      "../taal-en-syntax.chapter.tex",
    ],
    tex = _.map(files, function (filename) {
      return fs.readFileSync(__dirname + "/" + filename, "utf8");
    }).join("\n\n").replace(/\r/g, "");

var html = parse(tokenize(tex)),
    template = fs.readFileSync("./werkstuk_template.html", "utf8");

fs.writeFileSync("./html/werkstuk.html", template.replace("{BODY}", html), "utf8");
