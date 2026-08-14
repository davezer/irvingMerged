function escapeHtml(
  value
) {
  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


function inlineMarkdown(
  value
) {
  let text =
    escapeHtml(
      value
    );

  /*
   * Links — only http/https.
   */
  text =
    text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

  text =
    text.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong>$1</strong>'
    );

  text =
    text.replace(
      /`([^`]+)`/g,
      '<code>$1</code>'
    );

  text =
    text.replace(
      /(^|[^*])\*([^*]+)\*/g,
      '$1<em>$2</em>'
    );

  return text;
}


export function renderWeeklyMarkdown(
  markdown
) {
  const lines =
    String(
      markdown ?? ''
    )
      .replace(
        /\r\n/g,
        '\n'
      )
      .split('\n');

  const html = [];

  let paragraph = [];
  let listType = null;

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }

    html.push(
      `<p>${paragraph
        .map(
          inlineMarkdown
        )
        .join(' ')}</p>`
    );

    paragraph = [];
  }

  function closeList() {
    if (!listType) {
      return;
    }

    html.push(
      `</${listType}>`
    );

    listType = null;
  }

  for (
    const rawLine of lines
  ) {
    const line =
      rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading3 =
      line.match(
        /^###\s+(.+)$/
      );

    if (heading3) {
      flushParagraph();
      closeList();

      html.push(
        `<h3>${inlineMarkdown(
          heading3[1]
        )}</h3>`
      );

      continue;
    }

    const heading2 =
      line.match(
        /^##\s+(.+)$/
      );

    if (heading2) {
      flushParagraph();
      closeList();

      html.push(
        `<h2>${inlineMarkdown(
          heading2[1]
        )}</h2>`
      );

      continue;
    }

    const heading1 =
      line.match(
        /^#\s+(.+)$/
      );

    if (heading1) {
      flushParagraph();
      closeList();

      /*
       * Article title already exists,
       * so markdown H1 becomes H2.
       */
      html.push(
        `<h2>${inlineMarkdown(
          heading1[1]
        )}</h2>`
      );

      continue;
    }

    const quote =
      line.match(
        /^>\s?(.+)$/
      );

    if (quote) {
      flushParagraph();
      closeList();

      html.push(
        `<blockquote>${inlineMarkdown(
          quote[1]
        )}</blockquote>`
      );

      continue;
    }

    const bullet =
      line.match(
        /^[-*]\s+(.+)$/
      );

    if (bullet) {
      flushParagraph();

      if (
        listType !==
        'ul'
      ) {
        closeList();

        html.push(
          '<ul>'
        );

        listType =
          'ul';
      }

      html.push(
        `<li>${inlineMarkdown(
          bullet[1]
        )}</li>`
      );

      continue;
    }

    const numbered =
      line.match(
        /^\d+\.\s+(.+)$/
      );

    if (numbered) {
      flushParagraph();

      if (
        listType !==
        'ol'
      ) {
        closeList();

        html.push(
          '<ol>'
        );

        listType =
          'ol';
      }

      html.push(
        `<li>${inlineMarkdown(
          numbered[1]
        )}</li>`
      );

      continue;
    }

    closeList();

    paragraph.push(
      line
    );
  }

  flushParagraph();
  closeList();

  return html.join(
    '\n'
  );
}