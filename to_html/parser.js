
var parser = function (tokens) {
      var state = {
            currentCodeFragment: false,
            codelines: false,
            blocks: [],
            list: false,
            inParagraph: false
          };
      
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        
        actionRules[token.name](state, token);
      }
      
      return state.blocks.join("\n");
    },
    actionRules = {
      newCodeFragment: function (state, token) {
        state.codeFragment = createCodeFragment(token.label, token.title);
      },
      codeFragmentCaption: function (state, token) {
        if (!state.codeFragment) throw Error("@codeFragmentCaption");
        state.blocks.push(state.codeFragment.makeCaption());
      },
      "codelines.begin": function (state) {
        if (!state.codeFragment) throw Error("@codelines.begin");
        state.codelines = state.codeFragment.newCodeLines();
      },
      codeline: function (state, token) {
        if (!state.codelines) throw Error("@codeline");
        state.codelines.addLine(token.label, token.codeline, token.comment);
      },
      "codelines.end": function (state) {
        if (!state.codelines) throw Error("@codelines.end");
        state.blocks.push(state.codelines.toHTML());
      },
      comment: function (state, token) {
        state.blocks.push("<!-- " + token.comment + " -->");
      },
      htmlinsert: function (state, token) {
        state.blocks.push("<p>htmlinsert:" + token.filename + "</p>");
      },
      chapter: function (state, token) {
        state.blocks.push("<h2>" + token.title + "</h2>");
      },
      section: function (state, token) {
        state.blocks.push("<h3>" + token.title + "</h3>");
      },
      subsection: function (state, token) {
        state.blocks.push("<h4>" + token.title + "</h4>");
      },
      subsubsection: function (state, token) {
        state.blocks.push("<h5>" + token.title + "</h5>");
      },
      displaymath: function (state, token) {
        state.blocks.push("<p class='displaymath'>" + token.raw + "</p>");
      },
      label: function (state, token) {
        state.blocks.push("<div id='" + token.label + "'></div>");
      },
      item: function (state, token) {
        if (!state.list) throw Error("@item");
        state.list.add(token.text, token.item);
      },
      "itemize.begin": function (state, token) {
        state.list = createList("ul", "li");
      },
      "enumerate.begin": function (state, token) {
        state.list = createList("ol", "li");
      },
      "description.begin": function (state, token) {
        state.list = createList("dl", "dd", "dt");
      },
      "itemize.end": function (state) {
        if (!state.list) throw Error("@itemize.end");
        state.blocks.push(state.list.toHTML());
      },
      "enumerate.end": function (state) {
        if (!state.list) throw Error("@enumerate.end");
        state.blocks.push(state.list.toHTML());
      },
      "description.end": function (state) {
        if (!state.list) throw Error("@description.end");
        state.blocks.push(state.list.toHTML());
      },
      blankline: function (state) {
        state.inParagraph = false;
      },
      text: function (state, token) {
        if (state.blocks.length == 0 || state.blocks[state.blocks.length - 1].slice(0, 3) != "<p>") {
          state.inParagraph = false;
        }
        
        if (!state.inParagraph) {
          state.inParagraph = true;
          state.blocks.push("<p>" + formatText(token.line) + "</p>");
        } else {
          state.blocks[state.blocks.length - 1] =
            state.blocks[state.blocks.length - 1].replace("</p>", formatText(token.line) + "</p>");
        }
      }
    };

/*
@  - blankline
@  - htmlinsert           filename
@  - comment              comment
@  - codeline             label, codeline, comment
@  - newCodeFragment      label, title
@  - codeFragmentCaption
@  - chapter              title
@  - section              title
@  - subsection           title
@  - subsubsection        title
@  - label                label
@  - displaymath          env, raw
@  - text                 line
@  - item                 item (opt), text
@  - itemize.begin
@  - itemize.end
@  - description.begin
@  - description.end
@  - enumerate.begin
@  - enumerate.end
@  - codelines.begin
@  - codelines.end
*/

var createList = function (listTag, textTag, itemTag) {
      var children = [];
      
      return {
        add: function (text, item) {
          var child = "<T>X</T>"
            .replace(/T/g, textTag)
            .replace("X", formatText(text));
          if (itemTag) {
            child = "<I>X</I>"
              .replace(/I/g, itemTag)
              .replace("X", formatText(item))
              + child;
          }
          children.push(child);
          return this;
        },
        toHTML: function () {
          return "<L>X</L>"
            .replace(/L/g, listTag)
            .replace("X", children.join("\n"));
        }
      };
    },
    createCodeFragment = function (label, title) {
      var codelineSets = [];
      
      return {
        newCodeLines: function () {
          var numLinesSoFar = codelineSets.reduce(function (n, codelines) {
                return n + codelines.numLines();
              }, 0),
              codelines = createCodeLines(numLinesSoFar);
          
          codelineSets.push(codelines);
          return codelines;
        },
        makeCaption: function () {
          return "<p>caption for code fragment [" + label + "][" + title + "]</p>";
        }
      };
    },
    createCodeLines = function (lineno) {
      var lines = [];
      
      return {
        addLine: function (label, codeline, comment) {
          lines.push("<tr>"+
            "<td class='lineno'>" + (++lineno) + "</td>" +
            "<td class='code'>" + formatCodeLine(codeline) + "</td>" +
            "<td class='comment'>" + comment + "</td>" +
          "</tr>");
        },
        toHTML: function () {
          return "<table class='code-fragment'>" + lines.join("\n") + "</table>";
        },
        numLines: function () {
          return lines.length;
        }
      };
    },
    formatCodeLine = function (codeline) {
      return "$" + codeline + " $";
    },
    formatText = function (text) {
      return text
        .replace(/``/g, "“")
        .replace(/''/g, "”")
        .replace(/\\#/g, "#")
        .replace(/\\dots[ ]*/g, "…")
        .replace(/\\emph\{([^\}]*)\}/g, "<span class='em'>$1</span>")
        .replace(/\\textbf\{([^\}]*)\}/g, "<span class='bf'>$1</span>")
        .replace(/\\textit\{([^\}]*)\}/g, "<span class='it'>$1</span>")
        .replace(/\\textrm\{([^\}]*)\}/g, "<span class='rm'>$1</span>");
    };

module.exports = parser;
