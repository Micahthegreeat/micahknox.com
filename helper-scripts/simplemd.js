
(function () {

  function sanitizeHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html;

    const allowedTags = new Set([
      "p","br","h1","h2","h3","h4","h5","h6",
      "ul","ol","li","blockquote",
      "code","pre",
      "strong","em",
      "table","thead","tbody","tr","th","td",
      "a","input"
    ]);

    const allowedAttrs = {
      "a": ["href"],
      "input": ["type","checked","disabled"],
      "code": ["class"],
      "th": ["style"],
      "td": ["style"]
    };

    function isSafeUrl(url) {
      return /^(https?:|mailto:|#)/i.test(url);
    }

    function walk(node) {
      [...node.children].forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (!allowedTags.has(tag)) {
          el.replaceWith(...el.childNodes);
          return;
        }

        [...el.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();

          if (!(allowedAttrs[tag] || []).includes(name)) {
            el.removeAttribute(name);
            return;
          }

          if (tag === "a" && name === "href") {
            if (!isSafeUrl(attr.value)) {
              el.removeAttribute("href");
            }
          }

          if (name.startsWith("on")) {
            el.removeAttribute(name);
          }
        });

        walk(el);
      });
    }

    walk(template.content);
    return template.innerHTML;
  }


  function parseMarkdown(md) {
    md = md.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;");

    // code blocks
    md = md.replace(/```(\w+)?\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre><code class="lang-${lang || ""}">${code.trim()}</code></pre>`
    );

    // inline code
    md = md.replace(/`([^`]+)`/g, "<code>$1</code>");

    // headings
    for (let i = 6; i >= 1; i--) {
      md = md.replace(
        new RegExp("^" + "#".repeat(i) + " (.*)$", "gm"),
        `<h${i}>$1</h${i}>`
      );
    }

    // blockquotes
    md = md.replace(/(^|\n)&gt; (.*(?:\n&gt; .*)*)/g, m =>
      `<blockquote>${m.replace(/(^|\n)&gt; /g, "").trim()}</blockquote>`
    );

    // links
    md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>'
    );

    // bold / italic
    md = md.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    md = md.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    md = md.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // lists + checkboxes
    md = md.replace(/(?:^|\n)([-*] .*(?:\n[-*] .*)*)/g, block => {
      const items = block.trim().split("\n").map(line => {
        let content = line.replace(/^[-*] /, "");
        const cb = content.match(/^\[( |x)\] (.*)/);
        if (cb) {
          const checked = cb[1] === "x" ? "checked" : "";
          content = `<input type="checkbox" disabled ${checked}> ${cb[2]}`;
        }
        return `<li>${content}</li>`;
      });
      return "<ul>" + items.join("") + "</ul>";
    });

    // paragraphs
    md = md.replace(/\n{2,}/g, "</p><p>");
    md = "<p>" + md + "</p>";

    // cleanup
    md = md.replace(/<p>(<(ul|ol|li|pre|blockquote|table)[\s\S]*?>)<\/p>/g, "$1");

    // line breaks
    md = md.replace(/\n/g, "<br>");

    return sanitizeHTML(md);
  }


  // PUBLIC API
  window.SimpleMD = {
    render: function (url, element) {
      fetch(url)
        .then(r => r.text())
        .then(md => {
          element.innerHTML = parseMarkdown(md);
        });
    },

    parse: function (md) {
      return parseMarkdown(md);
    }
  };

})();
