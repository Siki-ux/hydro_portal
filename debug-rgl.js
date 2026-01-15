const rgl = require('react-grid-layout');
console.log('Keys:', Object.keys(rgl));
console.log('WidthProvider type:', typeof rgl.WidthProvider);
try {
    console.log('Default keys:', Object.keys(rgl.default));
    console.log('Default WidthProvider type:', typeof rgl.default.WidthProvider);
} catch (e) {
    console.log('No default export');
}
