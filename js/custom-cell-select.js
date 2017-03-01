﻿// Custom multi-cell selection directive for UI-Grid
// Created by brendenjpeterson@gmail.com

angular.module('ui.grid')
.directive('uiGridCustomCellSelect', ['$timeout', '$document', '$filter', 'rowSearcher', 'uiGridConstants', function ($timeout, $document, $filter, rowSearcher, uiGridConstants) {
    return {
        replace: true,
        require: '^uiGrid',
        scope: false,
        controller: function () { },
        compile: function () {
            return {
                pre: function ($scope, $elm, $attrs, uiGridCtrl) { },
                post: function ($scope, $elm, $attrs, uiGridCtrl) {
                    var _scope = $scope;
                    var grid = uiGridCtrl.grid;


                    // Data setup
                    _scope.ugCustomSelect = {
                        hiddenInput: angular.element('<input class="ui-grid-custom-selection-input" type="text" />').appendTo('body'),
                        isDragging: false,
                        selectedCells: [],
                        cellMap: {},
                        copyData: '',
                        dragData: {
                            startCell: {
                                row: null,
                                col: null
                            },
                            endCell: {
                                row: null,
                                col: null
                            }
                        }
                    }

                    // Bind events
                    $timeout(function () {
                        grid.element.on('mousedown', '.ui-grid-cell-contents', dragStart);
                        grid.element.on('mouseenter', '.ui-grid-cell-contents', mouseEnterCell);
                        angular.element('body').on('mouseup', bodyMouseUp);
                        angular.element(document).on('keydown', documentKeyUp);
                        angular.element(document).on('copy', documentCopyCells);
                        grid.api.core.on.scrollBegin(_scope, gridScrollBegin);
                        grid.api.core.on.scrollEnd(_scope, gridScrollEnd);

                        grid.api.core.on.filterChanged(_scope, clearDragData);
                        grid.api.core.on.columnVisibilityChanged(_scope, clearDragData);
                        grid.api.core.on.rowsVisibleChanged(_scope, clearDragData);
                        grid.api.core.on.sortChanged(_scope, clearDragData);
                    });

                    // Events
                    function dragStart(evt) {
                        if (angular.element(evt.target).hasClass('ui-grid-cell-contents')) {
                            var cellData = $(this).data().$scope;
                            clearDragData();
                            _scope.ugCustomSelect.isDragging = true;
                            setStartCell(cellData.row, cellData.col);
                            setSelectedStates();
                        }
                    }

                    function mouseEnterCell(evt) {
                        if (_scope.ugCustomSelect.isDragging) {
                            var cellData = $(this).data().$scope;
                            setEndCell(cellData.row, cellData.col);
                            setSelectedStates();
                        }
                    }

                    function bodyMouseUp(evt) {
                        if (_scope.ugCustomSelect.isDragging) {
                            _scope.ugCustomSelect.isDragging = false;
                            setSelectedStates();
                        }
                    }

                    function documentKeyUp(evt) {
                        var cKey = 67;
                        if (evt.keyCode == cKey && evt.ctrlKey && window.getSelection() + '' === '') {
                            _scope.ugCustomSelect.hiddenInput.val(' ').focus().select();
                            document.execCommand('copy');
                            evt.preventDefault();
                        }
                    }

                    function documentCopyCells(evt) {
                        var cbData,
                            cbType;

                        if (evt.originalEvent.clipboardData) {
                            cbData = evt.originalEvent.clipboardData;
                            cbType = 'text/plain';
                        } else {
                            cbData = window.clipboardData;
                            cbType = 'Text';
                        }

                        if (cbData && (window.getSelection() + '' === '' || window.getSelection() + '' === ' ') && _scope.ugCustomSelect.copyData !== '') {
                            cbData.setData(cbType, _scope.ugCustomSelect.copyData);
                            evt.preventDefault();
                        }
                    }

                    function gridScrollBegin() {
                        grid.element.addClass('ui-grid-custom-selected-scrolling');
                    }

                    function gridScrollEnd() {
                        angular.element('.ui-grid-custom-selected').removeClass('ui-grid-custom-selected');
                        var visibleCols = grid.renderContainers.body.renderedColumns;
                        var visibleRows = grid.renderContainers.body.renderedRows;

                        for (var ri = 0; ri < visibleRows.length; ri++) {
                            var currentRow = visibleRows[ri];
                            for (var ci = 0; ci < visibleCols.length; ci++) {
                                var currentCol = visibleCols[ci];

                                if (cellIsSelected(currentRow, currentCol)) {
                                    getCellElem(currentCol, ri).find('.ui-grid-cell-contents').addClass('ui-grid-custom-selected');
                                }
                            }
                        }

                        grid.element.removeClass('ui-grid-custom-selected-scrolling');
                    }

                    // Functions
                    function setStartCell(row, col) {
                        _scope.ugCustomSelect.dragData.startCell.row = row;
                        _scope.ugCustomSelect.dragData.startCell.col = col;
                    }

                    function setEndCell(row, col) {
                        _scope.ugCustomSelect.dragData.endCell.row = row;
                        _scope.ugCustomSelect.dragData.endCell.col = col;
                    }

                    function clearDragData() {
                        clearEndCell();
                        clearStartCell();
                        clearSelectedStates();
                        _scope.ugCustomSelect.copyData = '';
                    }

                    function clearStartCell() {
                        _scope.ugCustomSelect.dragData.startCell.row = null;
                        _scope.ugCustomSelect.dragData.startCell.col = null;
                    }

                    function clearEndCell() {
                        _scope.ugCustomSelect.dragData.endCell.row = null;
                        _scope.ugCustomSelect.dragData.endCell.col = null;
                    }

                    // Sets selected styling based on start cell and end cell, including cells in between that range
                    function setSelectedStates() {
                        clearSelectedStates();
                        var indexMap = createIndexMap(_scope.ugCustomSelect.dragData.startCell, _scope.ugCustomSelect.dragData.endCell);
                        _scope.ugCustomSelect.selectedCells = getCellsWithIndexMap(indexMap);
                        _scope.ugCustomSelect.cellMap = _scope.ugCustomSelect.selectedCells.reduce(function (map, obj) {
                            if (map[obj.row.uid]) {
                                map[obj.row.uid].push(obj.col.uid);
                            } else {
                                map[obj.row.uid] = [obj.col.uid];
                            }
                            return map;
                        }, {});

                        for (var i = 0; i < _scope.ugCustomSelect.selectedCells.length; i++) {
                            var currentCell = _scope.ugCustomSelect.selectedCells[i];
                            currentCell.elem.find('.ui-grid-cell-contents').addClass('ui-grid-custom-selected');
                        }

                        _scope.ugCustomSelect.copyData = createCopyData(_scope.ugCustomSelect.selectedCells, (indexMap.col.end - indexMap.col.start) + 1);
                    }

                    // Clears selected state from any selected cells
                    function clearSelectedStates() {
                        angular.element('.ui-grid-custom-selected').removeClass('ui-grid-custom-selected');
                        _scope.ugCustomSelect.selectedCells = [];
                        _scope.ugCustomSelect.cellMap = {};
                    }

                    function createIndexMap(startCell, endCell) {
                        var rowStart = grid.renderContainers.body.renderedRows.indexOf(_scope.ugCustomSelect.dragData.startCell.row),
                            rowEnd = grid.renderContainers.body.renderedRows.indexOf(_scope.ugCustomSelect.dragData.endCell.row),
                            colStart = grid.renderContainers.body.renderedColumns.indexOf(_scope.ugCustomSelect.dragData.startCell.col),
                            colEnd = grid.renderContainers.body.renderedColumns.indexOf(_scope.ugCustomSelect.dragData.endCell.col)

                        if (rowEnd === -1)
                            rowEnd = rowStart;

                        if (colEnd === -1)
                            colEnd = colStart;

                        return {
                            row: {
                                start: (rowStart < rowEnd) ? rowStart : rowEnd,
                                end: (rowEnd > rowStart) ? rowEnd : rowStart
                            },
                            col: {
                                start: (colStart < colEnd) ? colStart : colEnd,
                                end: (colEnd > colStart) ? colEnd : colStart
                            }
                        };
                    }

                    function getCellsWithIndexMap(indexMap) {
                        var visibleCols = grid.renderContainers.body.renderedColumns;
                        var visibleRows = grid.renderContainers.body.renderedRows;
                        var cellsArray = [];

                        for (var ri = indexMap.row.start; ri <= indexMap.row.end; ri++) {
                            var currentRow = visibleRows[ri];
                            for (var ci = indexMap.col.start; ci <= indexMap.col.end; ci++) {
                                var currentCol = visibleCols[ci];
                                var cellElem = getCellElem(currentCol, ri);

                                if (cellElem) {
                                    cellsArray.push({
                                        row: currentRow,
                                        col: currentCol,
                                        elem: cellElem
                                    });
                                }
                            }
                        }

                        return cellsArray;
                    }

                    function cellIsSelected(row, col) {
                        if (row && col) {
                            return _scope.ugCustomSelect.cellMap[row.uid] !== undefined && _scope.ugCustomSelect.cellMap[row.uid].indexOf(col.uid) > -1;
                        }
                        return false;
                    }

                    function getCellElem(col, rowIndex) {
                        return (col && col.uid && typeof rowIndex == 'number') ? angular.element('#' + grid.id + '-' + rowIndex + '-' + col.uid + '-cell') : null;
                    }

                    function createCopyData(cells, numCols) {
                        var copyData = '';

                        for (var i = 0; i < cells.length; i++) {
                            var currentCell = cells[i];
                            var cellValue = grid.getCellDisplayValue(currentCell.row, currentCell.col);

                            copyData += cellValue;

                            if ((i + 1) % numCols === 0 && i !== cells.length - 1) {
                                copyData += '\n';
                            } else if (i !== cells.length - 1) {
                                copyData += '\t';
                            }
                        }

                        return copyData;
                    }
                }
            };
        }
    };
}]);