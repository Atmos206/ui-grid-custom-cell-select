Custom Cell Selection Plugin for UI Grid
=================================

## Features
* Copy cell contents with CTRL+C or CMD+C
* Paste cell contents with CTRL+V or CMD+V

## Install
Install using npm

```sh
npm install ui-grid-custom-cell-select
```

Install using bower

```sh
bower install ui-grid-custom-cell-select
```

Add plugin as dependency to your module

```js
angular.module("app", ["ui.grid", "ui.grid.custom-cell-select"]);
```

## Usage
To add custom cell selection functionality you have to insert `ui-grid-custom-cell-select` directive to your table.

```html
<div ui-grid="gridOptions" class="grid" ui-grid-custom-cell-select="selectOptions"></div>
```

## Settings

An object may be provided to the `ui-grid-custom-cell-select` attribute. 

- `ignoreRightClick` - (Default: false) Will not begin dragging when right mouse is used. Useful for context menus.

## Additional styling
When you select grid cells ann additional css class (`ui-grid-draggable-row-over`) is applied to them. This plugin has default styling for these elements. If you are using __less__ you could import styles into your application.


## List of events


## Public methods


## Handling grouping

## Todo
- [ ] Improve documentation/readme
- [ ] Cleanup code to meet UI-Grid module standards
- [ ] Write tests
- [ ] Add more features!

## Support
If my plugin helped you, feel free to [paypal me whatever you think it was worth](http://paypal.me/atmos206)!

## Author
Plugin **ui-grid-custom-cell-select** was originally developed by [Brenden Peterson](https://github.com/atmos206).

Paste functionality and macOS compatibility by [Jairo Honorio](https://github.com/jahd2602).

## License
The MIT License &copy; 2016 - 2017
