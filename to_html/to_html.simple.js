
var fs = require("fs"),
    _ = require("./underscore-min");

var files = [
      "../inleiding.chapter.tex",
      "../notatie-en-terminologie.chapter.tex",
      "../taal-en-syntax.chapter.tex",
      "../semantisch-model.chapter.tex",
      "../natuurlijke-semantiek.chapter.tex",
    ],
    tex = _.map(files, function (filename) {
      return fs.readFileSync(__dirname + "/" + filename, "utf8");
    }).join("\n\n"),
    to_html = function (tex) {
      var template = fs.readFileSync(__dirname + "/template.html", "utf8"),
          lines = tex.split("\n");
      /*
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line[0] == "%") {
          lines[i] = "<!--" + line + "-->";
        }
      }
      */
      var html = lines.join("")
        .replace(/%(.*)/gm, "")
        .replace(/``/g, "&ldquo;")
        .replace(/''/g, "&rdquo;")
        .replace(/\\dots/g, "&hellip;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\chapter\{([^\}]*)\}/g, "<h2>$1</h2>")
        .replace(/\\section\{([^\}]*)\}/g, "<h3>$1</h3>")
        .replace(/\\subsection\{([^\}]*)\}/g, "<h4>$1</h4>")
        .replace(/\\subsubsection\{([^\}]*)\}/g, "<h5>$1</h5>")
        .replace(/\\emph\{([^\}]*)\}/g, "<em>$1</em>");
      
      return template.replace("{BODY}", html);
    };

fs.writeFileSync(__dirname + "/html/werkstuk.html", to_html(tex));
