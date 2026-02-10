const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const fmt1d = (n) => Number.isFinite(n) ? (Math.round(n * 10) / 10).toFixed(1) : '';
const fmtInt = (n) => Number.isFinite(n) ? String(Math.trunc(n)) : '';

const MARGIN = 50;

function drawTableAuto(doc, { x, y, widths, header, rows, fontSize = 9.5, lineGap = 2 }) {
  const contentWidth = doc.page.width - 2 * MARGIN;

  const total = widths.reduce((a, b) => a + b, 0);
  if (total > contentWidth) {
    const scale = contentWidth / total;
    for (let i = 0; i < widths.length; i++) widths[i] = Math.floor(widths[i] * scale);
  }

  const startX = x;
  let cy = y;

  doc.fontSize(fontSize);

  doc.font('Helvetica-Bold');

  // calcula altura de cada coluna do header
  const headerHeights = header.map((h, i) =>
    doc.heightOfString(h, { width: widths[i] - 4, lineGap })
  );
  const maxHeaderHeight = Math.max(...headerHeights);
  const headerY = cy;

  // desenha cada coluna do header **centralizada verticalmente**
  header.forEach((h, i) => {
    const offsetX = i ? widths.slice(0, i).reduce((a, b) => a + b, 0) : 0;
    const cellHeight = headerHeights[i];
    const textY = headerY + (maxHeaderHeight - cellHeight) / 2; // centraliza vertical
    doc.text(h, startX + offsetX + 2, textY, { width: widths[i] - 4 });
  });

  // move cy para baixo para a primeira linha da tabela
  cy += maxHeaderHeight;

  // linha separadora
  doc.moveTo(startX, cy).lineTo(startX + widths.reduce((a, b) => a + b, 0), cy).stroke();

  doc.font('Helvetica'); // volta para fonte normal


  const addPageIfNeeded = () => {
    const bottomLimit = doc.page.height - MARGIN - 40;
    if (cy > bottomLimit) {
      doc.addPage();
      cy = MARGIN + 10;

      doc.font('Helvetica-Bold');
      header.forEach((h, i) => {
        const offset = i ? widths.slice(0, i).reduce((a, b) => a + b, 0) : 0;
        doc.text(h, startX + offset + 2, cy, { width: widths[i] - 4 });
      });
      cy += doc.heightOfString('A', { width: 10, lineGap });
      doc.moveTo(startX, cy + 2).lineTo(startX + widths.reduce((a, b) => a + b, 0), cy + 2).stroke();
      doc.font('Helvetica');
    }
  };

  rows.forEach((cols, rowIndex) => {
    const heights = cols.map((text, i) =>
      doc.heightOfString(String(text ?? ''), { width: widths[i] - 4, lineGap })
    );
    const rowH = Math.max(...heights) + 6;

    addPageIfNeeded();

    // FUNDO ZEBRA
    if (rowIndex % 2 === 0) {
      doc
        .rect(startX, cy, widths.reduce((a, b) => a + b, 0), rowH)
        .fill('#ebf0f5');
      doc.fillColor('#000');
    }

    cols.forEach((text, i) => {
      const offset = i ? widths.slice(0, i).reduce((a, b) => a + b, 0) : 0;
      const alignRight = i >= 1;
      doc.text(String(text ?? ''), startX + offset + 2, cy + 3, {
        width: widths[i] - 6,
        lineGap,
        align: alignRight ? 'right' : 'left'
      });
    });

    cy += rowH;
  });

  return cy;
}


app.post('/relatorios/pdf', async (req, res) => {
  try {
    const jsonPath = req.body?.jsonPath
      ? path.join(__dirname, '..', req.body.jsonPath)
      : path.join(__dirname, '..', 'data', 'relatorio.json');

    const raw = await fs.readFile(jsonPath, 'utf8');
    const dados = JSON.parse(raw);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="relatorio.pdf"');
    res.setHeader('Cache-Control', 'no-store');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const periodo = `${dados.filtro?.dataInicial ?? ''} a ${dados.filtro?.dataFinal ?? ''}`;
    const ctx = dados.filtro?.ctx ?? '';
    const hospital = dados.dadoshospital?.nome ?? '';

    // CABEÇALHO
    doc.rect(0, 0, doc.page.width, 90)
      .fill('#0f172a');

    doc.fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(hospital, MARGIN, 25);

    doc.font('Helvetica')
      .fontSize(11)
      .text(`Contexto: ${ctx} • Período: ${periodo}`, MARGIN, 55);

    doc.fillColor('#000');

    // TITULO TABELA
    doc
      .moveDown(3)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('Relatório de Indicadores', MARGIN);

    const header = [
      'Indicador',
      'Benchmark',
      'Limite endêmico',
      'Denominador',
      'Casos (numerador)',
      'Taxa no hospital'
    ];

    const rows = (dados.dados || []).map((it) => {
      const benchmark = it.percentil50;

      const taxa = it.denominador ? (it.numerador / it.denominador) * it.constante : 0;

      return [
        it.descricao || '',
        fmt1d(benchmark),
        fmt1d(it.limiteEndemico),
        fmtInt(it.denominador),
        fmtInt(it.numerador),
        fmt1d(taxa)
      ];
    });


    const widths = [210, 50, 70, 55, 60, 50];

    drawTableAuto(doc, {
      x: MARGIN,
      y: doc.y + 10,
      widths,
      header,
      rows,
      fontSize: 9.5,
      lineGap: 1.5
    });


    const rodapeWidth = doc.page.width - 2 * MARGIN;

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#444')
      .text(`Principal referência para benchmarks: ${dados.benchmarkReferencia || ''}`, MARGIN, doc.y, { width: rodapeWidth, align: 'left' });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao gerar PDF.' });
  }
});

app.listen(3000, () => console.log('App em http://localhost:3000'));
