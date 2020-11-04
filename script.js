(function () {
  const PAGE_SCALE = 1;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let PAGE_NUMBER = 1;

  const App = document.getElementById('app');
  const isLoaded =
    document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !document.documentElement.doScroll);

  // pdf location ex:
  const samplePDF =
    'https://media-cdn.getbento.com/accounts/b7afc34a90a360e516fe2f25122db225/media/zaS2B02RRidrev1Mbb9U_10.28_JontCounter.pdf';
  // const samplePDF =
  //   'https://drive.google.com/file/d/15Rr2Epk8ec-cZg0PYbimUeZyoYcKm-M2NPY5pAtnnGcb6FRQIhHnvTGFPyPe/view?usp=sharing';
  const searchParams = new URLSearchParams(window.location.search);
  const pdfURL = searchParams.get('file') || samplePDF;

  const buildSVG = (viewport, textContent) => {
    // Building SVG with size of the viewport (for simplicity)
    const svg = document.createElementNS(SVG_NS, 'svg:svg');
    svg.setAttribute('width', viewport.width + 'px');
    svg.setAttribute('height', viewport.height + 'px');
    // items are transformed to have 1px font size
    svg.setAttribute('font-size', 1);

    // processing all items
    textContent.items.forEach(function (textItem) {
      // we have to take in account viewport transform, which includes scale,
      // rotation and Y-axis flip, and not forgetting to flip text.
      const tx = pdfjsLib.Util.transform(
        pdfjsLib.Util.transform(viewport.transform, textItem.transform),
        [1, 0, 0, -1, 0, 0]
      );
      const style = textContent.styles[textItem.fontName];
      // adding text element
      const text = document.createElementNS(SVG_NS, 'svg:text');
      text.setAttribute('transform', 'matrix(' + tx.join(' ') + ')');
      text.setAttribute('font-family', style.fontFamily);
      text.textContent = textItem.str;
      svg.appendChild(text);
    });

    return svg;
  };

  const buildPageCounter = (page, total) => {
    const pageCounter = document.createElement('div');
    pageCounter.className = 'pageCounter';
    pageCounter.textContent = `${page}/${total}`;
    return pageCounter;
  };

  const loadPdf = (PDF_PATH) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'http://mozilla.github.io/pdf.js/build/pdf.worker.js';

    const loadingTask = pdfjsLib.getDocument({ url: PDF_PATH });

    loadingTask.promise.then((pdfDocument) => {
      const {
        _pdfInfo: { numPages }
      } = pdfDocument;

      const loadPdfPage = (PAGE_NUMBER) => {
        console.log(`loading ${PAGE_NUMBER}`);

        pdfDocument.getPage(PAGE_NUMBER).then((page) => {
          const viewport = page.getViewport({ scale: PAGE_SCALE });

          page.getTextContent().then(function (textContent) {
            const page = document.createElement('div');

            page.appendChild(buildPageCounter(PAGE_NUMBER, numPages));
            page.appendChild(buildSVG(viewport, textContent));

            App.replaceChildren(page);
          });
        });
      };

      // init
      loadPdfPage(PAGE_NUMBER);

      document.addEventListener('swiped-left', function (e) {
        PAGE_NUMBER === numPages ? PAGE_NUMBER : PAGE_NUMBER++;
        console.log(PAGE_NUMBER);
        loadPdfPage(PAGE_NUMBER);
      });

      document.addEventListener('swiped-right', function (e) {
        PAGE_NUMBER === 1 ? 1 : PAGE_NUMBER--;
        console.log(PAGE_NUMBER);
        loadPdfPage(PAGE_NUMBER);
      });
    });
  };

  const init = () => {
    console.log('init');
    loadPdf(pdfURL);
  };

  if (isLoaded) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
