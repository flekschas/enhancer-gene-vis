import { globalPubSub } from 'pub-sub-es';
import IntervalTree from '@flatten-js/interval-tree';

import { toAbsPosition } from './utils';

async function loadFile(
  file,
  chromInfo,
  { header = true, columnImportance = 7 } = {}
) {
  const tree = new IntervalTree();
  const text = await file.text();
  const lines = text.split(/\r\n|\n/);
  for (let i = +header; i < lines.length; i++) {
    const fields = lines[i].split('\t');
    const chromOffset = toAbsPosition(`${fields[0]}:0`, chromInfo);
    const startAbs = toAbsPosition(`${fields[0]}:${fields[1]}`, chromInfo);
    const endAbs = toAbsPosition(`${fields[0]}:${fields[2]}`, chromInfo);
    tree.insert([startAbs, endAbs], {
      chrOffset: chromOffset,
      xStart: startAbs,
      xEnd: endAbs,
      importance: +fields[columnImportance],
      uid: `${file.name}-${i}`,
      name: fields[3],
      fields,
    });
  }
  return tree;
}

const createLocalBedDataServer = (
  file,
  id,
  chromInfo,
  tilesetInfo,
  options
) => {
  const whenIndex = loadFile(file, chromInfo, options);

  const requestTileHandler = ({ fileId, z, x, requestId }) => {
    if (fileId !== id) return;
    whenIndex.then((index) => {
      const tileWidth = tilesetInfo.max_width / 2 ** z;
      const start = tileWidth * x;
      const end = start + tileWidth;
      const results = index.search([start, end]);
      globalPubSub.publish(`localBed:tile:${requestId}`, results);
    });
  };

  const requestTilesetInfoHandler = ({ fileId, requestId }) => {
    if (fileId !== id) return;
    globalPubSub.publish(`localBed:tilesetInfo:${requestId}`, tilesetInfo);
  };

  const subscriptionTile = globalPubSub.subscribe(
    'localBed:requestTile',
    requestTileHandler
  );

  const subscriptionTilesetInfo = globalPubSub.subscribe(
    'localBed:requestTilesetInfo',
    requestTilesetInfoHandler
  );

  const destroy = () => {
    globalPubSub.unsubscribe(subscriptionTile);
    globalPubSub.unsubscribe(subscriptionTilesetInfo);
  };

  return {
    destroy,
  };
};

export default createLocalBedDataServer;
