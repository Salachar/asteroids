const COLORS = {
  'red': ''
}
const Draw = {
  whiteStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.stroke();
  },

  redStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ff0000';
    context.lineWidth = 1;
    context.stroke();
  },

  neonStroke: (context, config = {}) => {
    let {
      fill = false,
      color = { hex: '#FFFFFF' },
      highlight = null,
      strokeWidth = 2,
    } = config;

    if (fill) {
      context.save();
        context.globalAlpha = 0.75;
        context.fillStyle = fill.hex || '#221f26';
        context.fill();
      context.restore();
    }

    context.lineCap = 'round';
    context.shadowBlur = 20;
    context.shadowColor = color.hex;
    context.strokeStyle = color.hex;
    context.lineWidth = strokeWidth * 2;
    context.stroke();

    if (highlight) {
      context.lineCap = 'round';
      context.shadowBlur = 10;
      context.shadowColor = highlight.hex;
      context.strokeStyle = highlight.hex;
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }
};

module.exports = Draw;
