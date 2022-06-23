import { globalPubSub } from 'pub-sub-es';
import IntervalTree from '@flatten-js/interval-tree';

import { toAbsPosition } from '../utils';
import { ChromosomeInfoResult } from 'higlass';

// TODO: Find a better location for this?
export type TilesetInfo = {
  zoom_step: number;
  max_length: number;
  assembly: string;
  chrom_names: string;
  chrom_sizes: string;
  tile_size: number;
  max_zoom: number;
  max_width: number;
  min_pos: number[];
  max_pos: number[];
  header: string;
  version: number;
  coordSystem: string;
};

type LoadFileOptions = {
  header?: boolean;
  columnImportance?: number;
};
type BedFileIntervalTreeValue = {
  chrOffset: number;
  xStart: number;
  xEnd: number;
  importance: number;
  uid: string;
  name: string;
  fields: string[];
};
async function loadFile(
  file: File,
  chromInfo: ChromosomeInfoResult,
  { header = true, columnImportance = 7 }: LoadFileOptions = {}
) {
  const tree = new IntervalTree<BedFileIntervalTreeValue>();
  const text = await file.text();
  const lines = text.split(/\r\n|\n/);
  for (let i = +header; i < lines.length; i++) {
    const fields = lines[i].split('\t');
    const chromOffset: number = toAbsPosition(`${fields[0]}:0`, chromInfo);
    const startAbs: number = toAbsPosition(
      `${fields[0]}:${fields[1]}`,
      chromInfo
    );
    const endAbs: number = toAbsPosition(
      `${fields[0]}:${fields[2]}`,
      chromInfo
    );
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

type RequestTileHandlerArgs = {
  fileId: string;
  z: number;
  x: number;
  requestId: string;
};

type RequestTilesetInfoHandlerArgs = {
  fileId: string;
  requestId: string;
};

export type LocalBedDataServer = {
  destroy: () => void;
};

const createLocalBedDataServer = (
  file: File,
  id: string,
  chromInfo: ChromosomeInfoResult,
  tilesetInfo: TilesetInfo,
  options: LoadFileOptions
): LocalBedDataServer => {
  const whenIndex = loadFile(file, chromInfo, options);

  const requestTileHandler = ({
    fileId,
    z,
    x,
    requestId,
  }: RequestTileHandlerArgs) => {
    if (fileId !== id) return;
    whenIndex.then((index) => {
      const tileWidth = tilesetInfo.max_width / 2 ** z;
      const start = tileWidth * x;
      const end = start + tileWidth;
      const results = index.search([start, end]);
      globalPubSub.publish(`localBed:tile:${requestId}`, results);
    });
  };

  const requestTilesetInfoHandler = ({
    fileId,
    requestId,
  }: RequestTilesetInfoHandlerArgs) => {
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
