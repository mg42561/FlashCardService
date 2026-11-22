const svgNamespace = 'http://www.w3.org/2000/svg';
const htmlNamespace = 'http://www.w3.org/1999/xhtml';
const mathNamespace = 'http://www.w3.org/1998/Math/MathML';
const richTextElements = new Set([
    'p', 'div', 'span', 'br', 'strong', 'em', 'b', 'i', 'sub', 'sup',
    'ul', 'ol', 'li', 'code'
]);
const mathElements = new Set([
    'math', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mfrac', 'msqrt', 'mroot',
    'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover',
    'mtable', 'mtr', 'mtd'
]);
const diagramElements = new Set([
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
    'polygon', 'text', 'tspan', 'title', 'desc'
]);
const diagramAttributes = new Set([
    'viewBox', 'width', 'height', 'preserveAspectRatio', 'transform',
    'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r',
    'rx', 'ry', 'dx', 'dy', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
    'fill-rule', 'opacity', 'fill-opacity', 'stroke-opacity',
    'font-size', 'font-weight', 'text-anchor', 'dominant-baseline',
    'role', 'aria-label'
]);

function copyDiagram(source) {
    if (source.namespaceURI !== svgNamespace || !diagramElements.has(source.localName)) {
        return null;
    }

    const element = document.createElementNS(svgNamespace, source.localName);
    for (const { name, value, namespaceURI } of source.attributes) {
        // Paint attributes can also accept URL references. Keep only colors and none.
        const isPaint = name === 'fill' || name === 'stroke';
        const isPlainColor = /^(?:[a-z]+|#[0-9a-f]+|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+/-]+\))$/i.test(value.trim())
            && (value.trim() === 'none' || CSS.supports('color', value));
        if (!namespaceURI && (diagramAttributes.has(name) || (isPaint && isPlainColor))) {
            element.setAttribute(name, value);
        }
    }

    for (const child of source.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const diagramChild = copyDiagram(child);
            if (diagramChild) element.append(diagramChild);
        } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
            element.append(child.data);
        }
    }
    return element;
}

function parseDiagram(markup) {
    // The wrapper supplies the namespace for deck snippets that omit xmlns.
    const parsed = new DOMParser().parseFromString(
        `<diagram xmlns="${svgNamespace}">${markup}</diagram>`, 'image/svg+xml'
    );
    const wrapper = parsed.documentElement;
    const root = wrapper.firstElementChild;
    if (wrapper.localName !== 'diagram' || wrapper.childElementCount !== 1 ||
        root.localName !== 'svg' || Array.from(wrapper.childNodes).some(
            node => node.nodeType !== Node.ELEMENT_NODE
        )) {
        return null;
    }
    return copyDiagram(root);
}

function appendRichContent(target, source) {
    for (const child of source.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            target.append(child.data);
            continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        const { localName, namespaceURI } = child;
        const inMath = target.namespaceURI === mathNamespace;
        if (!inMath && namespaceURI === svgNamespace && localName === 'svg') {
            target.append(copyDiagram(child));
        } else if (namespaceURI === mathNamespace && mathElements.has(localName) &&
            (inMath || localName === 'math')) {
            const math = document.createElementNS(mathNamespace, localName);
            if (localName === 'math' && child.getAttribute('display') === 'block') {
                math.setAttribute('display', 'block');
            }
            const label = child.getAttribute('aria-label');
            if (label !== null) math.setAttribute('aria-label', label);
            appendRichContent(math, child);
            target.append(math);
        } else if (!inMath && namespaceURI === htmlNamespace && richTextElements.has(localName)) {
            const element = document.createElement(localName);
            if (localName === 'div' && child.classList.contains('card-diagram-layout')) {
                element.className = 'card-diagram-layout';
            }
            appendRichContent(element, child);
            target.append(element);
        }
    }
}

function renderRichContent(container, value) {
    // Parse inside an inert template and copy only the allowed elements and attributes.
    const template = document.createElement('template');
    template.innerHTML = value;
    const content = document.createDocumentFragment();
    appendRichContent(content, template.content);

    const searchContent = content.cloneNode(true);
    for (const element of searchContent.querySelectorAll('svg, math, br')) {
        const label = element.getAttribute('aria-label') ||
            (element.namespaceURI === svgNamespace ? element.querySelector('title')?.textContent : element.textContent);
        element.replaceWith(` ${label || ''} `);
    }
    for (const block of searchContent.querySelectorAll('div, p, li')) {
        block.append(' ');
    }
    container.replaceChildren(content);
    return searchContent.textContent.replace(/\s+/g, ' ').trim();
}

export function renderCardContent(container, value, format) {
    if (format === 'rich' && typeof value === 'string') {
        return renderRichContent(container, value);
    }
    if (typeof value !== 'string' || !/<svg(?=[\s/>])/.test(value)) {
        container.textContent = value;
        return value;
    }

    const parts = [];
    const searchParts = [];
    // Match complete tags so quoted attributes, comments and CDATA stay intact.
    const tags = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[\w:-]+(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/g;
    let start = 0;
    let depth = 0;
    let textStart = 0;

    for (const match of value.matchAll(tags)) {
        const tag = match[0];
        if (/^<svg(?=[\s/>])/.test(tag)) {
            if (depth === 0) start = match.index;
            depth++;
            if (!tag.endsWith('/>')) continue;
        } else if (depth === 0 || !/^<\/svg\s*>$/.test(tag)) {
            continue;
        }

        depth--;
        if (depth > 0) continue;

        const end = match.index + tag.length;
        const diagram = parseDiagram(value.slice(start, end));
        if (!diagram) continue;

        const text = value.slice(textStart, start);
        parts.push(text, diagram);
        searchParts.push(text, diagram.getAttribute('aria-label') ||
            diagram.querySelector('title')?.textContent || '');
        textStart = end;
    }

    const remainingText = value.slice(textStart);
    parts.push(remainingText);
    searchParts.push(remainingText);
    container.replaceChildren(...parts);
    return searchParts.join(' ').trim();
}
