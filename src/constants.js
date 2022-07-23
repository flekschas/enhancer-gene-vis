export const DRAWER_WIDTH = 240;

export const EPS = 1e-6;

export const SVG_SKELETON = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg" version="1.1" width="_WIDTH_px" height="_HEIGHT_px">
    <g id="enhancer-plot">
    _ENHANCER_
    </g>
    <g id="enhancer-gene-plot" transform="translate(0, _ENHANCER_GENE_Y_)">
    _ENHANCER_GENE_
    </g>
    <g id="dna-accessibility-plot" transform="translate(_DNA_ACCESS_X_, 0)">
    _DNA_ACCESS_
    </g>
</svg>`;

export const DEFAULT_COLOR_MAP = [
  // '#c17da5', // pink
  '#c76526', // red
  '#6fb2e4', // light blue
  '#eee462', // yellow
  '#469b76', // green
  '#3170ad', // dark blue
  '#dca237', // orange
  '#000000', // black
  '#999999', // gray
];

export const DEFAULT_COLOR_MAP_DARK = [
  // '#a1688a', // pink
  '#a65420', // red
  '#4a7798', // light blue
  '#999026', // yellow
  '#3a8162', // green
  '#295d90', // dark blue
  '#b7872e', // orange
  '#000000', // black
  '#666666', // gray
];

export const DEFAULT_COLOR_MAP_LIGHT = [
  // '#f5e9f0', // pink
  '#f6e5db', // red
  '#e7f2fb', // light blue
  '#f2eda9', // yellow
  '#e0eee8', // green
  '#dde7f1', // dark blue
  '#f5e4c4', // orange
  '#d5d5d5', // black
  '#ffffff', // gray
];

export const GENE_SEARCH_URL =
  'https://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA';

export const VARIANT_SEARCH_URL =
  'https://resgen.io/api/v1/suggest/?d=VF5-RDXWTxidGMJU7FeaxA';

// const EG_TILE_UID = 'GOxTKzoLSsuw0BaG6eBrXw'; // V2
export const EG_TILE_UID = 'e3lpYv5LSIiik7CFtuAMTw'; // V3

export const EG_TILE_V3 = EG_TILE_UID === 'e3lpYv5LSIiik7CFtuAMTw';

export const BIOSAMPLE_COLUMN = EG_TILE_V3 ? 6 : 10;
export const GENE_NAME_COLUMN = EG_TILE_V3 ? 3 : 6;
export const ABC_SCORE_COLUMN = EG_TILE_V3 ? 5 : 7;

export const LOCAL_BED_TILESET_INFO_HG19 = {
  zoom_step: 1,
  max_length: 3137161265,
  assembly: 'hg19',
  chrom_names:
    'chr1\tchr2\tchr3\tchr4\tchr5\tchr6\tchr7\tchr8\tchr9\tchr10\tchr11\tchr12\tchr13\tchr14\tchr15\tchr16\tchr17\tchr18\tchr19\tchr20\tchr21\tchr22\tchrX\tchrY\tchrM\tchr6_ssto_hap7\tchr6_mcf_hap5\tchr6_cox_hap2\tchr6_mann_hap4\tchr6_apd_hap1\tchr6_qbl_hap6\tchr6_dbb_hap3\tchr17_ctg5_hap1\tchr4_ctg9_hap1\tchr1_gl000192_random\tchrUn_gl000225\tchr4_gl000194_random\tchr4_gl000193_random\tchr9_gl000200_random\tchrUn_gl000222\tchrUn_gl000212\tchr7_gl000195_random\tchrUn_gl000223\tchrUn_gl000224\tchrUn_gl000219\tchr17_gl000205_random\tchrUn_gl000215\tchrUn_gl000216\tchrUn_gl000217\tchr9_gl000199_random\tchrUn_gl000211\tchrUn_gl000213\tchrUn_gl000220\tchrUn_gl000218\tchr19_gl000209_random\tchrUn_gl000221\tchrUn_gl000214\tchrUn_gl000228\tchrUn_gl000227\tchr1_gl000191_random\tchr19_gl000208_random\tchr9_gl000198_random\tchr17_gl000204_random\tchrUn_gl000233\tchrUn_gl000237\tchrUn_gl000230\tchrUn_gl000242\tchrUn_gl000243\tchrUn_gl000241\tchrUn_gl000236\tchrUn_gl000240\tchr17_gl000206_random\tchrUn_gl000232\tchrUn_gl000234\tchr11_gl000202_random\tchrUn_gl000238\tchrUn_gl000244\tchrUn_gl000248\tchr8_gl000196_random\tchrUn_gl000249\tchrUn_gl000246\tchr17_gl000203_random\tchr8_gl000197_random\tchrUn_gl000245\tchrUn_gl000247\tchr9_gl000201_random\tchrUn_gl000235\tchrUn_gl000239\tchr21_gl000210_random\tchrUn_gl000231\tchrUn_gl000229\tchrUn_gl000226\tchr18_gl000207_random',
  chrom_sizes:
    '249250621\t243199373\t198022430\t191154276\t180915260\t171115067\t159138663\t146364022\t141213431\t135534747\t135006516\t133851895\t115169878\t107349540\t102531392\t90354753\t81195210\t78077248\t59128983\t63025520\t48129895\t51304566\t155270560\t59373566\t16571\t4928567\t4833398\t4795371\t4683263\t4622290\t4611984\t4610396\t1680828\t590426\t547496\t211173\t191469\t189789\t187035\t186861\t186858\t182896\t180455\t179693\t179198\t174588\t172545\t172294\t172149\t169874\t166566\t164239\t161802\t161147\t159169\t155397\t137718\t129120\t128374\t106433\t92689\t90085\t81310\t45941\t45867\t43691\t43523\t43341\t42152\t41934\t41933\t41001\t40652\t40531\t40103\t39939\t39929\t39786\t38914\t38502\t38154\t37498\t37175\t36651\t36422\t36148\t34474\t33824\t27682\t27386\t19913\t15008\t4262',
  tile_size: 1024.0,
  max_zoom: 22,
  max_width: 4294967296.0,
  min_pos: [1],
  max_pos: [3137161265],
  header:
    'chrom1\tstart1\tend1\tchrom2\tstart2\tend2\ttargetGene\tscore\tstrand1\tstrand2\tcellType',
  version: 2,
  coordSystem: '',
};

export const IGNORED_FOCUS_ELEMENTS = new Set(['input', 'textarea']);

export const HIGLASS_PAN_ZOOM = 'panZoom';

export const HIGLASS_SELECT = 'select';
