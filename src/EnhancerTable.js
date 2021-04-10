import React from 'react';
import { useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Table from 'react-virtualized/dist/commonjs/Table';
import Column from 'react-virtualized/dist/commonjs/Column';

import EnhancerGenesInfo from './EnhancerGenesInfo';
import EnhancerGenesHelp from './EnhancerGenesHelp';
import EnhancerGenesSettings from './EnhancerGenesSettings';
import TitleBar from './TitleBar';

import { focusRegionState, useEnhancerGenesShowInfos } from './state';

const useStyles = makeStyles((theme) => ({
  plot: {
    minHeight: '6rem',
  },
}));

const EnhancerTable = React.memo(function EnhancerTable() {
  const focusRegion = useRecoilValue(focusRegionState);

  const classes = useStyles();

  return (
    <div>
      <TitleBar
        id="enhancer-table"
        title="Enhancers"
        popoverDirection="top"
        useShowInfo={useEnhancerGenesShowInfos}
        Info={EnhancerGenesInfo}
        Help={EnhancerGenesHelp}
        Settings={EnhancerGenesSettings}
      />
      <div className={classes.plot}>
        {focusRegion && (
          <AutoSizer disableHeight>
            {({ width }) => (
              <Table
                ref="Table"
                disableHeader={disableHeader}
                headerClassName={styles.headerColumn}
                headerHeight={headerHeight}
                height={height}
                noRowsRenderer={this._noRowsRenderer}
                overscanRowCount={overscanRowCount}
                rowClassName={this._rowClassName}
                rowHeight={useDynamicRowHeight ? this._getRowHeight : rowHeight}
                rowGetter={rowGetter}
                rowCount={rowCount}
                scrollToIndex={scrollToIndex}
                sort={this._sort}
                sortBy={sortBy}
                sortDirection={sortDirection}
                width={width}
              >
                {!hideIndexRow && (
                  <Column
                    label="Index"
                    cellDataGetter={({ rowData }) => rowData.index}
                    dataKey="index"
                    disableSort={!this._isSortEnabled()}
                    width={60}
                  />
                )}
                <Column
                  dataKey="name"
                  disableSort={!this._isSortEnabled()}
                  headerRenderer={this._headerRenderer}
                  width={90}
                />
                <Column
                  width={210}
                  disableSort
                  label="The description label is really long so that it will be truncated"
                  dataKey="random"
                  className={styles.exampleColumn}
                  cellRenderer={({ cellData }) => cellData}
                  flexGrow={1}
                />
              </Table>
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  );
});

export default EnhancerTable;
