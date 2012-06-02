
var c = function (x) {
      console.log(x);
      return x;
    },
    _uid = 1,
    uid = function () {
      return ++_uid;
    },
    mathEnvironments = [
      "align",
      "align*",
      "alignat",
      "alignat*",
      "aligned",
      "alignedat",
      "array",
      "Bmatrix",
      "bmatrix",
      "cases",
      "eqnarray",
      "eqnarray*",
      "equation",
      "equation*",
      "gather",
      "gather*",
      "gathered",
      "matrix",
      "multline",
      "multline*",
      "pmatrix",
      "smallmatrix",
      "split",
      "subarray",
      "Vmatrix",
      "vmatrix"
    ],
    ignoreRules = [
      /^[ ]*\\begin\{NoBreak\}/,
      /^[ ]*\\end\{NoBreak\}/,
      /^[ ]*\\begin\{codelines\}/,
      /^[ ]*\\end\{codelines\}/,
      // \begin{htmlskip} --> \end{htmlskip}
      function (lines) {
        if (lines[0].indexOf("\\begin{htmlskip}") < 0) return false;
        
        do {
          lines.splice(0, 1);
        } while (lines[0].indexOf("\\end{htmlskip}") < 0);
        lines.splice(0, 1);
        return true;
      }
    ],
    tokenRules = [
      [/^[ \t]*$/, "blankline"],
      // \htmlinsert{FILENAME}
      function (lines) {
        var m = lines[0].match(/^[ ]*\\htmlinsert\{([a-zA-Z0-9_\-\.])*\}/);
        if (!m) return false;
        
        lines.splice(0, 1);
        return { name: "htmlinsert", filename: m[1] };
      },
      // %comment lines
      function (lines) {
        var comment = []
        while (lines[0][0] == "%") {
          comment.push(lines[0].slice(1));
          lines.splice(0, 1);
        }
        if (comment.length == 0) return false;
        
        return { name: "comment", comment: comment.join("\n") };
      },
      function (lines) {
        var m = lines[0].match(/^[ ]*\\codeLine(?:\[([^\]]*)\])?\{/);
        if (!m) return false;
        
        var line     = lines[0],
            label    = m[1] || ("label" + uid()),
            codeline = line.slice(m[0].length, -1),
            comment  = "";
        if (line[line.length - 1] == "]") {
        } else {
          var depth = 0;
          for (var i = 0; i < codeline.length; i++) {
            if (codeline[i] == "{") {
              depth++;
            } else if (codeline[i] == "}") {
              depth--;
            }
            if (depth == -1) {
              comment = codeline.slice(i + 1);
              codeline = codeline.slice(0, i);
              break;
            }
          }
        }
        
        lines.splice(0, 1);
        return { name: "codeline", label: label, codeline: codeline, comment: comment };
      },
      // \newCodeFragment[LABEL][TITLE]
      function (lines) {
        var m = lines[0].match(/^[ ]*\\newCodeFragment(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?/);
        if (!m) return false;
        
        lines.splice(0, 1);
        return { name: "newCodeFragment", label: m[1], title: m[2] };
      },
      [/^[ ]*\\codeFragmentCaption/,       "codeFragmentCaption"],
      [/^[ ]*\\chapter\{([^\}]*)\}/,       "chapter",       [ [1, "title"] ]],
      [/^[ ]*\\section\{([^\}]*)\}/,       "section",       [ [1, "title"] ]],
      [/^[ ]*\\subsection\{([^\}]*)\}/,    "subsection",    [ [1, "title"] ]],
      [/^[ ]*\\subsubsection\{([^\}]*)\}/, "subsubsection", [ [1, "title"] ]],
      [/^[ ]*\\label\{([^\}]*)\}/,         "label",         [ [1, "label"] ]],
      // displaymath environments
      function (lines) {
        var env,
            n = 0;
        for (var i = 0; i < mathEnvironments.length; i++) {
          env = mathEnvironments[i];
          if (lines[0].indexOf("\\begin{" + env + "}") >= 0) {
            do {
              n++;
            } while (lines[n].indexOf("\\end{" + env + "}") < 0);
            
            return { name: "displaymath", raw: lines.splice(0, n).join("\n") };
          }
        }
        return false;
      },
      // text
      function (lines) {
        var line = lines[0];
        lines.splice(0, 1);
        
        var m = line.match(/^(?:(?!.%).)*(?!\\).%/);
        if (m) {
          return [
            { name: "text", line: m[0].slice(0, -1) },
            { name: "comment", comment: line.slice(m[0].length) }
          ];
        }
        
        return { name: "text", line: line };
      }
    ],
    nextIgnore = function (lines) {
      for (var i = 0; i < ignoreRules.length; i++) {
        var rule = ignoreRules[i];
        if (rule instanceof RegExp) {
          if (lines[0].match(rule)) {
            lines.splice(0, 1);
            return true;
          }
        } else {
          if (rule(lines)) {
            return true;
          }
        }
      }
      return false;
    },
    nextToken = function (lines) {
      for (var i = 0; i < tokenRules.length; i++) {
        var rule = tokenRules[i];
        if (rule instanceof Array) {
          var regex = rule[0],
              name = rule[1],
              information = rule[2] || [];
          
          rule = function (lines) {
            var m = lines[0].match(regex);
            if (!m) return false;
            
            var token = { name: name };
            information.map(function (info) {
              token[info[1]] = m[info[0]];
            });
            lines.splice(0, 1);
            return token;
          };
        }
        
        token = rule(lines);
        if (token) {
          return token;
        }
      }
      return false;
    },
    tokenize = function (source) {
      var lines = source.split("\n"),
          it = 0,
          tokens = [],
          token;
      
      while (lines.length > 0 && ++it < 9999) {
        if (nextIgnore(lines)) {
          continue;
        }
        if (token = nextToken(lines)) {
          if (token instanceof Array) {
            tokens = tokens.concat(token);
          } else {
            tokens.push(token);
          }
          continue;
        }
        c(tokens);
      }
      
      return tokens;
    };

/*
  SKIP
-   \begin{NoBreak}
-   \end{NoBreak}
-   \begin{htmlskip} ~~> \end{htmlskip}
  TOKENS
-   \htmlinsert{...}                            => { name: "htmlinsert", filename: ... }
-   %...                                        => { name: "comment", comment: ... }
-   \newCodeFragment[...][...]                  => { name: "newCodeFragment", label: ..., title: ... }
-   \codeFragmentCaption                        => { name: "codeFragmentCaption" }
-   \chapter{...}, \section{...}, etc..         => { name: "chapter", title: ... }
-   \label{...}                                 => { name: "label", label: ... }
-   \begin{codelines}                           => goto CODELINES
-   \begin{MATHENVIRONMENT}                     => { name: "displaymath", raw: ... }, capture until \end{MATHENVIRONMENT}
-   RAW TEXT                                    => { name: "raw", raw: ... }
  CODELINES
-   \codeLine[...]{...}[...]                    => { name: "codeline", label: ..., codeline: ..., comment: ... }
-   \end{codelines}                             => goto TOKENS
*/

module.exports = tokenize;
