
var fs = require("fs"),
    _ = require("./underscore-min");

var Lexer = function (source) {
      //console.log("lexer");
      this.source = source;
      
      this.tokens = [];
      
      var it = 0;
      while (this.source != "" && it++ < 99999) {
        //console.log("  while");
        for (var i = 0; i < Lexer.spec.length; i++) {
          //console.log("    try [" + Lexer.spec[i].name + "]");
          var spec = Lexer.spec[i],
              m = this.source.match(spec.regex);
          if (!m) {
            //console.log("      NO");
            continue;
          }
          
          this.source = this.source.slice(m[0].length);
          
          var token = {
            name: spec.name
          };
          this.tokens.push(token);
          for (var j = 0; j < spec.information.length; j++) {
            token[spec.information[j][1]] = m[spec.information[j][0]];
          }
          //console.log("      YES");
          break;
        }
      }
    };

Lexer.spec = [
  {
    name: "chapter",
    regex: /^[\n\s]*\\chapter\{((?:[^\}]|\n)*)\}/,
    information: [ [1, "title"] ]
  },
  {
    name: "section",
    regex: /^[\n\s]*\\section\{((?:[^\}]|\n)*)\}/,
    information: [ [1, "title"] ]
  },
  {
    name: "subsection",
    regex: /^[\n\s]*\\subsection\{((?:[^\}]|\n)*)\}/,
    information: [ [1, "title"] ]
  },
  {
    name: "instruction",
    regex: /^[\n\s]*%[ ]*html[ ]*:[ ]*([a-z]+)(.*)/,
    information: [ [1, "instruction"] ]
  },
  {
    name: "end_instruction",
    regex: /^[\n\s]*%[ ]*\/html(.*)/,
    information: []
  },
  {
    name: "comment",
    regex: /^[\n\s]*%(.*)/,
    information: [ [1, "comment"] ]
  },
  {
    name: "paragraph",
    regex: /^[\n\s]*((?:(?!\n\n)\n|.)*)/,
    information: [ [1, "paragraph"] ]
  },
  {
    name: "rawline",
    regex: /^(.*)/,
    information: [ [1, "rawline"] ]
  }
];

var Node = function (token) {
      this.type = token.name;
      this.token = token;
      this.children = [];
    };

Node.prototype.push = function (node) {
  this.children.push(node);
  node.parent = this;
  return node;
};
Node.prototype.pop = function () {
  return this.parent;
};

var Parser = function (tokens) {
      this.tokens = tokens;
      
      this.structure = this.current_node = new Node({name: "top"});
      
      var skipping = false;
      for (var i = 0; i < this.tokens.length; i++) {
        var token = this.tokens[i];
        while (Parser.spec[ this.current_node.type ].indexOf(token.name) < 0) {
          this.current_node = this.current_node.pop();
        }
        this.current_node = this.current_node.push(new Node(token));
      }
    };

Parser.spec = {
  top: ["section", "paragraph", "comment", "rawline", "instruction"],
  section: ["paragraph"],
  paragraph: []
};

var Format = {
      paragraph: function (text) {
        return text
          .replace(/\\emph\{([^\}]*)\}/g, "<em>$1</em>")
          .replace(/``/g, "&ldquo;")
          .replace(/''/g, "&rdquo;");
      }
    };

var files = [
      "../inleiding.chapter.tex",
      "../notatie-en-terminologie.chapter.tex",
      "../taal-en-syntax.chapter.tex",
      "../semantisch-model.chapter.tex",
      "../natuurlijke-semantiek.chapter.tex",
    ],
    tex = _.map(files, function (filename) {
      return fs.readFileSync(__dirname + "/" + filename, "utf8");
    }).join("\n\n");

var lexer = new Lexer(tex);
var parser = new Parser(lexer.tokens.map(_.clone));
