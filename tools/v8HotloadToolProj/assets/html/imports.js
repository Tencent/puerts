(function () {
    const links = document.querySelectorAll('link[rel="import"]');
    // import and add each page to the DOM
    Array.prototype.forEach.call(links, (link) => {
        for (let className of ["#bodyLayer", "#navLayer", "#mainLayer"]) {
            let node = link.import.querySelector(className);
            if (node) {
                let clone = document.importNode(node.content, true);
                document.querySelector(className).appendChild(clone);
                break;
            }
        }
    });
})();