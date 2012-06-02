
/*
  The idea: Parse the TeX files and generate HTML output.
  - Simple stuff:
    - paragraphs
    - \chapter{...}
    - \section{...}
    - \emph{...}
    - ``...''
    - \dots => &hellip; -- maar niet binnen $...$, etc..
    - \textit{...}
  - Other things:
    - \label{xyz}, \ref{xyz} => <span id="xyz"></span> => <a href="#xyz">???</a>
    - \BNF, \BNF\
    - ~ => " "
    - \text{...} (in mathmode) => \class{rm}{\text{...}}
  - For MathJax, define the "simple" command like \NN with \def\NN{\mathbb{N}} or [Config:TeX.Macros]
  - Leave for MathJax:
    - $...$
    - \begin{equation*} ... \end{equation*}
    - \begin{align*} ... \end{align*}
    - etc..
  - Complicated things:
    - Code Fragments
    - % html: skip
      \complicatedTexStuff{...}
      % /html
    - % html: insert replacement.html
*/

var fs = require("fs"),
    _ = require("./underscore-min"),
    lex = require("./lexer");

var files = [
      "test.tex",
    ],
    tex = _.map(files, function (filename) {
      return fs.readFileSync(__dirname + "/" + filename, "utf8");
    }).join("\n\n").replace(/\r/g, "");

var tokens = lex(tex);
console.log(tokens);
