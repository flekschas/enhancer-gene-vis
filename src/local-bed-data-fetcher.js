import { globalPubSub } from 'pub-sub-es';

// Timeout requests after 10 seconds
const T_TIMEOUT = 10000;

const LocalCsvDataFetcher = function LocalCsvDataFetcher(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const createRandomId = () => Math.random().toString(36).substring(2);

  class LocalBedDataFetcherClass {
    constructor(dataConfig) {
      this.dataConfig = dataConfig;
    }

    tilesetInfo(callback) {
      this.tilesetInfoLoading = true;

      if (!this.tilesetInfoData) {
        this.tilesetInfoData = new Promise((resolve, reject) => {
          const requestId = createRandomId();
          const timeoutId = setTimeout(
            () =>
              reject(
                new Error(
                  `Could not load tileset info for ${this.dataConfig.id}`
                )
              ),
            T_TIMEOUT
          );
          globalPubSub.subscribe(
            `localBed:tilesetInfo:${requestId}`,
            (tilesetInfo) => {
              clearTimeout(timeoutId);
              this.tilesetInfoLoading = false;
              resolve(tilesetInfo);
            },
            1
          );
          globalPubSub.publish('localBed:requestTilesetInfo', {
            fileId: this.dataConfig.id,
            requestId,
          });
        });
      }

      this.tilesetInfoData.then((tilesetInfoData) => {
        callback(tilesetInfoData);
      });
    }

    /** We expect there to be a tilesetUid in the provided tilesetInfo
     * and tiles data since tileResponseToData needs it
     *
     * It is also easier for users to paste in request responses for debugging.
     */
    fetchTilesDebounced(loadHandler, tileIds) {
      Promise.all(tileIds.map((tileId) => this.tile(tileId.split('.')))).then(
        (tiles) => {
          loadHandler(
            tiles.reduce((response, tile, i) => {
              response[tileIds[i]] = tile;
              return response;
            }, {})
          );
        }
      );
    }

    tile([z, x]) {
      return new Promise((resolve, reject) => {
        const requestId = createRandomId();
        const timeoutId = setTimeout(
          () =>
            reject(
              new Error(
                `Could not load tile ${z}.${x} for ${this.dataConfig.id} (request: ${requestId})`
              )
            ),
          T_TIMEOUT
        );
        globalPubSub.subscribe(
          `localBed:tile:${requestId}`,
          (tile) => {
            clearTimeout(timeoutId);
            resolve(tile);
          },
          1
        );
        globalPubSub.publish('localBed:requestTile', {
          fileId: this.dataConfig.id,
          z: +z,
          x: +x,
          requestId,
        });
      });
    }
  }

  return new LocalBedDataFetcherClass(...args);
};

LocalCsvDataFetcher.config = {
  type: 'localBed',
};

export default LocalCsvDataFetcher;
